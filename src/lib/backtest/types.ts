// src/lib/backtest/types.ts

export type StrategyName = "MACD_CROSSOVER" | "MOMENTUM_BREAKOUT" | "MEAN_REVERSION";
export type Signal = "LONG" | "FLAT" | "SHORT";

export interface Bar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestParams {
  ticker: string;
  currency: "USD" | "INR";
  strategy: StrategyName;
  startYear: number;
  initialCapital: number;
  // Strategy specific
  params?: Record<string, number | boolean>;
  // Execution constraints
  costsEnabled?: boolean;
}

export interface Trade {
  entryDate: string;
  exitDate: string;
  entryPx: number;
  exitPx: number;
  returnPct: number;
  holdingDays: number;
  variableCosts: number;
  fixedCosts: number;
  side: "LONG" | "SHORT";
}

export interface BacktestResult {
  ticker: string;
  currency: "USD" | "INR";
  strategy: StrategyName;
  params: Record<string, number | boolean>;
  status: "OK" | "INSUFFICIENT_DATA";
  window: { entryYear: number; startDate: string; endDate: string; bars: number };

  equityCurve: Array<{ date: string; strategy: number; strategyGross: number; benchmark: number }>;
  trades: Trade[];

  benchmark: { endValue: number; totalReturn: number; cagr: number; maxDrawdown: number; sharpe: number };
  strategyStats: {
    grossEndValue: number; grossTotalReturn: number; grossCagr: number;
    endValue: number; totalReturn: number; cagr: number; costDragCagr: number;
    annualVol: number; sharpe: number; sortino: number; calmar: number;
    maxDrawdown: number; maxDrawdownDurationDays: number; exposurePct: number;
    beta: number; jensenAlpha: number; excessCAGR: number; informationRatio: number;
    numTrades: number; winRate: number; profitFactor: number; expectancy: number;
    avgHoldingDays: number; annualTurnover: number; 
    costs: {
      total: number;
      variableCosts: number;
      fixedCosts: number;
      variableDragPct: number;
      fixedDragPct: number;
      costPerRoundTripPct: number;
      breakEvenCapital: number;
    };
  };

  robustness: {
    inSampleCagr: number; outOfSampleCagr: number; degradationPct: number;
    monteCarlo: { cagrP5: number; cagrP50: number; cagrP95: number; maxDdP95: number };
  };

  verdict: { winner: "STRATEGY" | "BUY_AND_HOLD"; reason: string };
  flags: string[];
}
