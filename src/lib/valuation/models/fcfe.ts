// /src/lib/valuation/models/fcfe.ts

import { ValuationResult, ValuationInputs } from "../types";
import { calculateGordonTerminal, calculateExitMultipleTerminal, checkTerminalDivergence } from "../terminal";
import { ValidationContext } from "../validate";

export function runFCFE(
  inputs: ValuationInputs,
  ctx: ValidationContext,
  ke: number,
  g1: number,
  gTerm: number,
  currency: "USD" | "INR"
): ValuationResult {
  const years = 10;
  const fadeStart = 5;
  const midYear = true;

  const schedule = [];
  let currentFcfe = inputs.fcf; // Assuming inputs.fcf was properly set to FCFE by the input normalizer
  let presentValueSum = 0;

  for (let t = 1; t <= years; t++) {
    let g_t = g1;
    if (t > fadeStart) {
      g_t = g1 - ((g1 - gTerm) * (t - fadeStart)) / (years - fadeStart);
    }

    currentFcfe = currentFcfe * (1 + g_t);
    const discountPeriod = midYear ? t - 0.5 : t;
    const discountFactor = Math.pow(1 + ke, discountPeriod);
    const pv = currentFcfe / discountFactor;

    presentValueSum += pv;

    schedule.push({
      year: t,
      growth: g_t,
      fcf: currentFcfe,
      discountFactor,
      pv
    });
  }

  const finalFcfe = schedule[years - 1].fcf;
  
  // Terminal
  const gordon = calculateGordonTerminal(finalFcfe, ke, gTerm, years, midYear);
  const exitEbitda = inputs.ebitda > 0 ? inputs.ebitda * Math.pow(1 + g1, years) : 0;
  const exitMult = Math.max(8, (1 + gTerm) / (ke - gTerm)); 
  const exit = calculateExitMultipleTerminal(exitEbitda, exitMult, ke, years, midYear);

  if (checkTerminalDivergence(gordon, exit)) {
    ctx.flags.push("TERMINAL_METHOD_DIVERGENCE: Gordon and Exit Multiple diverge by >25%");
  }

  // FCFE yields Equity Value directly!
  const equityValue = presentValueSum + gordon.pv;
  
  // For standard reporting, we backtrack to EV roughly (not mathematically perfect, but for the interface)
  const totalDebt = inputs.totalDebt || 0;
  const cash = inputs.totalCash || 0;
  const minority = inputs.minorityInterest || 0;
  const preferred = inputs.preferredStock || 0;
  const nonOpAssets = inputs.nonOpAssets || 0;

  const enterpriseValue = equityValue + totalDebt + minority + preferred - cash - nonOpAssets;
  gordon.pctOfEV = equityValue > 0 ? gordon.pv / equityValue : 0;

  const sharesDiluted = inputs.sharesOutstanding;
  const perShare = sharesDiluted > 0 ? equityValue / sharesDiluted : 0;

  const evEbitdaExitPerShare = sharesDiluted > 0 
    ? (presentValueSum + exit.pv) / sharesDiluted 
    : 0;

  const upsideDownsidePct = inputs.price > 0 
    ? ((perShare - inputs.price) / inputs.price) * 100 
    : 0;

  return {
    ticker: inputs.ticker,
    currency,
    asOf: new Date().toISOString().split("T")[0],
    method: "FCFE",
    inputs: {
      fcf0: inputs.fcf,
      wacc: 0, 
      ke,
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
