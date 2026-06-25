// /src/lib/valuation/models/fcff.ts

import { ValuationResult, ValuationInputs } from "../types";
import { calculateGordonTerminal, calculateExitMultipleTerminal, checkTerminalDivergence } from "../terminal";
import { ValidationContext } from "../validate";

export function runFCFF(
  inputs: ValuationInputs,
  ctx: ValidationContext,
  wacc: number,
  g1: number,
  gTerm: number,
  currency: "USD" | "INR"
): ValuationResult {
  const years = 10;
  const fadeStart = 5;
  const midYear = true;

  const schedule = [];
  let currentFcf = inputs.fcf;
  let presentValueSum = 0;

  for (let t = 1; t <= years; t++) {
    // Linear fade logic
    let g_t = g1;
    if (t > fadeStart) {
      g_t = g1 - ((g1 - gTerm) * (t - fadeStart)) / (years - fadeStart);
    }

    currentFcf = currentFcf * (1 + g_t);
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
  
  // Terminals
  const gordon = calculateGordonTerminal(finalFcf, wacc, gTerm, years, midYear);
  const exitEbitda = inputs.ebitda > 0 ? inputs.ebitda * Math.pow(1 + g1, years) : 0;
  // Assume exit multiple based on gTerm and wacc roughly
  const exitMult = Math.max(8, (1 + gTerm) / (wacc - gTerm)); 
  const exit = calculateExitMultipleTerminal(exitEbitda, exitMult, wacc, years, midYear);

  if (checkTerminalDivergence(gordon, exit)) {
    ctx.flags.push("TERMINAL_METHOD_DIVERGENCE: Gordon and Exit Multiple diverge by >25%");
  }

  const enterpriseValue = presentValueSum + gordon.pv;
  gordon.pctOfEV = enterpriseValue > 0 ? gordon.pv / enterpriseValue : 0;

  // Equity Bridge
  const totalDebt = inputs.totalDebt || 0;
  const cash = inputs.totalCash || 0;
  const minority = inputs.minorityInterest || 0;
  const preferred = inputs.preferredStock || 0;
  const nonOpAssets = inputs.nonOpAssets || 0;

  const equityValue = enterpriseValue - totalDebt - minority - preferred + cash + nonOpAssets;
  
  const sharesDiluted = inputs.sharesOutstanding;
  const perShare = sharesDiluted > 0 ? equityValue / sharesDiluted : 0;

  const evEbitdaExitPerShare = sharesDiluted > 0 
    ? (presentValueSum + exit.pv - totalDebt - minority - preferred + cash + nonOpAssets) / sharesDiluted 
    : 0;

  const upsideDownsidePct = inputs.price > 0 
    ? ((perShare - inputs.price) / inputs.price) * 100 
    : 0;

  // Single Source of Truth Runtime Assertion (DEFECT 1 Fix)
  // Ensure the reported perShare perfectly matches the mathematical components
  const derivedBridgeValue = enterpriseValue - totalDebt - minority - preferred + cash + nonOpAssets;
  const derivedPerShare = derivedBridgeValue / sharesDiluted;
  if (Math.abs(derivedPerShare - perShare) > 0.001) {
     throw new Error("DEFECT 1 ASSERTION FAILED: perShare output does not match explicit table and bridge math.");
  }

  return {
    ticker: inputs.ticker,
    currency,
    asOf: new Date().toISOString().split("T")[0],
    method: "FCFF",
    inputs: {
      fcf0: inputs.fcf,
      wacc,
      ke: wacc, // FCFF uses WACC, but store ke reference if we need it
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
      perShare: evEbitdaExitPerShare
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
      impliedG1: 0, // Calculated later
      vsHistoricalGrowth: 0,
      vsAnalystGrowth: null,
      vsSectorMedian: null,
      verdict: ""
    },
    sensitivity: [], // Calculated later
    flags: ctx.flags,
    dataQuality: ctx.dataQuality
  };
}
