// /src/lib/valuation/models/ddmSustainable.ts

import { ValuationResult, ValuationInputs } from "../types";
import { ValidationContext } from "../validate";
import { calculateGordonTerminal, calculateExitMultipleTerminal, checkTerminalDivergence } from "../terminal";

export function runDDMSustainable(
  inputs: ValuationInputs,
  ctx: ValidationContext,
  ke: number,
  currency: "USD" | "INR"
): ValuationResult {
  const years = 10;
  
  // DDM implies valuing based on dividends. Payout should be high for this to be valid.
  const payout = inputs.payoutRatio ?? 0.8; 
  let currentDividend = 0;

  if (inputs.eps && inputs.eps > 0) {
    currentDividend = inputs.eps * payout;
  } else if (inputs.netIncome > 0 && inputs.sharesOutstanding > 0) {
    currentDividend = (inputs.netIncome / inputs.sharesOutstanding) * payout;
  }

  // Cap g1 for mature high yielders
  const g1 = Math.min(0.06, inputs.userGrowthRate ? inputs.userGrowthRate / 100 : 0.04);
  const gTerm = Math.min(macroGdpCap(currency), g1);

  const schedule = [];
  let presentValueSum = 0;
  let div = currentDividend;

  for (let t = 1; t <= years; t++) {
    div = div * (1 + g1); // usually linear or constant growth for utilities
    const discountFactor = Math.pow(1 + ke, t);
    const pv = div / discountFactor;
    
    presentValueSum += pv;
    
    schedule.push({
      year: t,
      growth: g1,
      fcf: div, // mapping dividend to fcf field
      discountFactor,
      pv
    });
  }

  const finalDiv = schedule[years - 1].fcf;
  
  // Scale everything to total firm equity level for the terminal logic to work seamlessly
  const totalFinalDiv = finalDiv * inputs.sharesOutstanding;
  const gordon = calculateGordonTerminal(totalFinalDiv, ke, gTerm, years, false);
  
  const equityValue = (presentValueSum * inputs.sharesOutstanding) + gordon.pv;
  const perShare = presentValueSum + (gordon.pv / inputs.sharesOutstanding);
  
  gordon.pctOfEV = equityValue > 0 ? gordon.pv / equityValue : 0;

  const upsideDownsidePct = inputs.price > 0 
    ? ((perShare - inputs.price) / inputs.price) * 100 
    : 0;
    
  const derivedBridgeValue = equityValue;
  const derivedPerShare = inputs.sharesOutstanding > 0 ? derivedBridgeValue / inputs.sharesOutstanding : 0;
  if (Math.abs(derivedPerShare - perShare) > 0.001) {
     console.warn("DEFECT 1 ASSERTION FAILED");
  }

  return {
    ticker: inputs.ticker,
    currency,
    asOf: new Date().toISOString().split("T")[0],
    method: "DDM_SUSTAINABLE",
    inputs: {
      fcf0: currentDividend,
      wacc: 0,
      ke,
      kd: 0,
      taxRate: 0,
      rf: 0,
      erp: 0,
      crp: 0,
      beta: inputs.beta,
      g1,
      gTerm,
      fadeStart: 10,
      years,
      netDebt: 0,
      sharesDiluted: inputs.sharesOutstanding,
      midYear: false
    },
    schedule,
    terminal: gordon,
    exitMultipleCrossCheck: {
      evEbitdaExit: 0,
      perShare: 0
    },
    enterpriseValue: equityValue,
    equityBridge: {
      ev: equityValue,
      totalDebt: 0,
      cash: 0,
      minority: 0,
      preferred: 0,
      nonOpAssets: 0,
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
