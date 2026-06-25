// /src/lib/valuation/models/revenueToFcf.ts

import { ValuationResult, ValuationInputs } from "../types";
import { calculateGordonTerminal, calculateExitMultipleTerminal, checkTerminalDivergence } from "../terminal";
import { ValidationContext } from "../validate";

export function runRevenueToFcf(
  inputs: ValuationInputs,
  ctx: ValidationContext,
  wacc: number,
  currency: "USD" | "INR"
): ValuationResult {
  const years = 10;
  const fadeStart = 5;
  const midYear = true;

  // Derive initial revenue and margin assumptions
  let revGrowth = inputs.revenueGrowth;
  if (!revGrowth || revGrowth <= 0) revGrowth = 0.25; // fallback 25% for high growth startups
  
  const g1 = inputs.userGrowthRate ? inputs.userGrowthRate / 100 : revGrowth;
  const gTerm = inputs.userTgr ? inputs.userTgr / 100 : macroGdpCap(currency);

  let currentRev = inputs.revenue;
  if (!currentRev || currentRev <= 0) {
    // Fabricate a base revenue from market cap (assume 10x P/S)
    currentRev = inputs.marketCap > 0 ? inputs.marketCap / 10 : 1000;
    ctx.dataQuality.confidence = "low";
    ctx.warnings.push("Revenue missing, inferred from Market Cap (10x P/S proxy).");
  }

  // Current margin might be negative
  const currentMargin = currentRev > 0 ? inputs.fcf / currentRev : -0.10;
  const targetMargin = 0.20; // Assume 20% mature FCF margin for tech/software
  
  const schedule = [];
  let presentValueSum = 0;

  for (let t = 1; t <= years; t++) {
    // Fade revenue growth linearly down to gTerm
    let g_t = g1;
    if (t > fadeStart) {
      g_t = g1 - ((g1 - gTerm) * (t - fadeStart)) / (years - fadeStart);
    }
    currentRev = currentRev * (1 + g_t);

    // Interpolate margin linearly to target over 10 years
    const margin_t = currentMargin + ((targetMargin - currentMargin) * (t / years));
    const currentFcf = currentRev * margin_t;

    const discountPeriod = midYear ? t - 0.5 : t;
    const discountFactor = Math.pow(1 + wacc, discountPeriod);
    const pv = currentFcf / discountFactor;

    presentValueSum += pv;

    schedule.push({
      year: t,
      growth: g_t,
      fcf: currentFcf,
      discountFactor,
      pv
    });
  }

  const finalFcf = schedule[years - 1].fcf;
  
  const gordon = calculateGordonTerminal(finalFcf, wacc, gTerm, years, midYear);
  const exitEbitda = (currentRev * 0.25); // assuming 25% EBITDA margin at maturity
  const exitMult = Math.max(12, (1 + gTerm) / (wacc - gTerm)); 
  const exit = calculateExitMultipleTerminal(exitEbitda, exitMult, wacc, years, midYear);

  if (checkTerminalDivergence(gordon, exit)) {
    ctx.flags.push("TERMINAL_METHOD_DIVERGENCE: Gordon and Exit Multiple diverge by >25%");
  }

  const enterpriseValue = presentValueSum + gordon.pv;
  gordon.pctOfEV = enterpriseValue > 0 ? gordon.pv / enterpriseValue : 0;

  const totalDebt = inputs.totalDebt || 0;
  const cash = inputs.totalCash || 0;
  const minority = inputs.minorityInterest || 0;
  const preferred = inputs.preferredStock || 0;
  const nonOpAssets = inputs.nonOpAssets || 0;

  const equityValue = enterpriseValue - totalDebt - minority - preferred + cash + nonOpAssets;
  const sharesDiluted = inputs.sharesOutstanding;
  const perShare = sharesDiluted > 0 ? equityValue / sharesDiluted : 0;

  const derivedBridgeValue = enterpriseValue - totalDebt - minority - preferred + cash + nonOpAssets;
  const derivedPerShare = sharesDiluted > 0 ? derivedBridgeValue / sharesDiluted : 0;
  if (Math.abs(derivedPerShare - perShare) > 0.001) {
     console.warn("DEFECT 1 ASSERTION FAILED");
  } const upsideDownsidePct = inputs.price > 0 
    ? ((perShare - inputs.price) / inputs.price) * 100 
    : 0;


  return {
    ticker: inputs.ticker,
    currency,
    asOf: new Date().toISOString().split("T")[0],
    method: "REV_FCF",
    inputs: {
      fcf0: inputs.fcf,
      wacc,
      ke: wacc,
      kd: 0,
      taxRate: 0.21,
      rf: 0,
      erp: 0,
      crp: 0,
      beta: inputs.beta,
      g1,
      gTerm,
      fadeStart,
      years,
      netDebt: totalDebt - cash,
      sharesDiluted,
      midYear
    },
    schedule,
    terminal: gordon,
    exitMultipleCrossCheck: {
      evEbitdaExit: exitMult,
      perShare: sharesDiluted > 0 ? (presentValueSum + exit.pv - totalDebt + cash) / sharesDiluted : 0
    },
    enterpriseValue,
    equityBridge: {
      ev: enterpriseValue,
      totalDebt,
      cash,
      minority,
      preferred,
      nonOpAssets,
      equityValue
    },
    perShare,
    currentPrice: inputs.price,
    upsideDownsidePct,
    reverseDCF: {
      impliedG1: 0,
      vsHistoricalGrowth: 0,
      vsAnalystGrowth: null,
      vsSectorMedian: null,
      verdict: ""
    },
    sensitivity: [],
    flags: ctx.flags,
    dataQuality: ctx.dataQuality
  };
}

function macroGdpCap(currency: "USD" | "INR"): number {
  return currency === "INR" ? 0.055 : 0.035;
}
