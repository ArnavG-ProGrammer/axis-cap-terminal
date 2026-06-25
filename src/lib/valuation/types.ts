export type ValuationMethod = "FCFF" | "FCFE" | "RIM" | "DDM_SUSTAINABLE" | "REV_FCF";

export interface ValuationInputs {
  ticker: string;
  price: number;
  marketCap: number;
  totalDebt: number;
  totalCash: number;
  sharesOutstanding: number;
  fcf: number;
  revenue: number;
  revenueGrowth: number;
  ebitda: number;
  netIncome: number;
  beta: number;
  sector: string;
  industry: string;
  country: string;
  dividendYield?: number;
  payoutRatio?: number;
  eps?: number;
  minorityInterest?: number;
  preferredStock?: number;
  nonOpAssets?: number;
  
  // User Overrides
  userGrowthRate?: number;
  userTgr?: number;
  userWacc?: number;
}

export interface ValuationResult {
  ticker: string;
  currency: "USD" | "INR";
  asOf: string;
  method: ValuationMethod;

  inputs: {
    fcf0: number;
    wacc: number;
    ke: number;
    kd: number;
    taxRate: number;
    rf: number;
    erp: number;
    crp: number;
    beta: number;
    g1: number;
    gTerm: number;
    fadeStart: number;
    years: number;
    netDebt: number;
    sharesDiluted: number;
    midYear: boolean;
  };

  schedule: Array<{
    year: number;
    growth: number;
    fcf: number;
    discountFactor: number;
    pv: number;
  }>;

  terminal: {
    method: "gordon" | "exitMultiple";
    value: number;
    pv: number;
    pctOfEV: number;
  };
  
  exitMultipleCrossCheck: {
    evEbitdaExit: number;
    perShare: number;
  };

  enterpriseValue: number;
  
  equityBridge: {
    ev: number;
    totalDebt: number;
    cash: number;
    minority: number;
    preferred: number;
    nonOpAssets: number;
    equityValue: number;
  };

  perShare: number;
  currentPrice: number;
  upsideDownsidePct: number;

  reverseDCF: {
    impliedG1: number;
    vsHistoricalGrowth: number;
    vsAnalystGrowth: number | null;
    vsSectorMedian: number | null;
    verdict: string;
  };

  sensitivity: number[][];   // rows = WACC steps, cols = gTerm steps, cells = perShare

  flags: string[];           // TERMINAL_HEAVY, LARGE_DIVERGENCE, DATA_INTEGRITY, ...
  
  dataQuality: {
    source: string;
    confidence: "high" | "medium" | "low";
    fcfMethod?: string;
    warnings: string[];
  };
}
