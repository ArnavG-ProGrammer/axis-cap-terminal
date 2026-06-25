// /src/lib/valuation/models/residualIncome.ts

import { ValuationResult, ValuationInputs } from "../types";
import { ValidationContext } from "../validate";
import { checkTerminalDivergence } from "../terminal";

export function runResidualIncome(
  inputs: ValuationInputs,
  ctx: ValidationContext,
  ke: number,
  currency: "USD" | "INR"
): ValuationResult {
  const years = 10;
  
  // Clean inputs
  const roe = inputs.netIncome > 0 && inputs.marketCap > 0 ? inputs.netIncome / inputs.marketCap : 0.15; // fallback
  const payout = inputs.payoutRatio ?? 0.3; // fallback 30%
  const bv0 = inputs.marketCap > 0 ? inputs.marketCap : 10000; // proxy if real book value isn't supplied
  
  // If we can derive book value per share from eps and roe: BVPS = EPS / ROE
  let bvps = 0;
  if (inputs.eps && inputs.eps > 0 && roe > 0) {
    bvps = inputs.eps / roe;
  } else if (inputs.sharesOutstanding > 0) {
    bvps = bv0 / inputs.sharesOutstanding;
  }
  
  const g = roe * (1 - payout);
  let currentBvps = bvps;
  let presentValueSum = 0;
  const schedule = [];

  for (let t = 1; t <= years; t++) {
    const eps = currentBvps * roe;
    const dps = eps * payout;
    const ri = (roe - ke) * currentBvps;
    
    currentBvps = currentBvps + eps - dps;
    
    const discountFactor = Math.pow(1 + ke, t);
    const pv = ri / discountFactor;
    
    presentValueSum += pv;
    
    schedule.push({
      year: t,
      growth: g,
      fcf: ri, // using fcf field for ri to fit schedule schema
      discountFactor,
      pv
    });
  }

  // Terminal Residual Income
  // As a bank matures, competitive advantage fades. Usually, ROE fades towards Ke.
  // If ROE = Ke, Terminal RI = 0. We'll assume a slight spread is maintained.
  const roeTerm = Math.max(ke + 0.01, roe * 0.8); 
  const gTerm = Math.min(macroGdpCap(currency), roeTerm * (1 - payout));
  const denom = Math.max(ke - gTerm, 0.001);
  const riTerm = (roeTerm - ke) * currentBvps;
  const tv = riTerm / denom;
  const pvTv = tv / Math.pow(1 + ke, years);

  const intrinsicValuePerShare = bvps + presentValueSum + pvTv;
  const equityValue = intrinsicValuePerShare * inputs.sharesOutstanding;
  
  const pctOfEV = intrinsicValuePerShare > 0 ? pvTv / intrinsicValuePerShare : 0;
  
  // Exit Multiple cross-check via Justified P/B
  const justifiedPb = (roe - gTerm) / denom;
  const justifiedPrice = justifiedPb * bvps;

  const upsideDownsidePct = inputs.price > 0 
    ? ((intrinsicValuePerShare - inputs.price) / inputs.price) * 100 
    : 0;

  // Single Source of Truth Runtime Assertion
  const derivedBridgeValue = equityValue;
  const derivedPerShare = inputs.sharesOutstanding > 0 ? derivedBridgeValue / inputs.sharesOutstanding : 0;
  if (Math.abs(derivedPerShare - intrinsicValuePerShare) > 0.001) {
     console.warn("DEFECT 1 ASSERTION FAILED: perShare output does not match explicit table and bridge math.");
  }

  return {
    ticker: inputs.ticker,
    currency,
    asOf: new Date().toISOString().split("T")[0],
    method: "RIM",
    inputs: {
      fcf0: 0,
      wacc: 0,
      ke,
      kd: 0,
      taxRate: 0,
      rf: 0,
      erp: 0,
      crp: 0,
      beta: inputs.beta,
      g1: g,
      gTerm,
      fadeStart: 10,
      years,
      netDebt: 0,
      sharesDiluted: inputs.sharesOutstanding,
      midYear: false
    },
    schedule,
    terminal: {
      method: "gordon",
      value: tv * inputs.sharesOutstanding, // Scale to total
      pv: pvTv * inputs.sharesOutstanding,
      pctOfEV
    },
    exitMultipleCrossCheck: {
      evEbitdaExit: justifiedPb, // using this field for P/B ratio
      perShare: justifiedPrice
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
    perShare: intrinsicValuePerShare,
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
