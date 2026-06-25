// src/lib/backtest/validate.ts

import { BacktestResult } from "./types";

export function validateBacktest(result: BacktestResult) {
  const flags: string[] = [];

  // SINGLE SOURCE OF TRUTH: The headline end value MUST equal the last point of the returned equity curve.
  if (result.equityCurve.length > 0) {
    const finalEquity = result.equityCurve[result.equityCurve.length - 1].strategy;
    if (Math.abs(finalEquity - result.strategyStats.endValue) > 0.01) {
      throw new Error("DEFECT 7 ASSERTION FAILED: renderedEndValue != equityCurve.at(-1)");
    }
    
    const finalBench = result.equityCurve[result.equityCurve.length - 1].benchmark;
    if (Math.abs(finalBench - result.benchmark.endValue) > 0.01) {
      throw new Error("DEFECT 7 ASSERTION FAILED: renderedBenchEndValue != benchmarkCurve.at(-1)");
    }
  }

  // NO LOOK-AHEAD
  // Signals generated at t lead to entry on t+1. We enforce this structurally in execution.ts.
  
  if (result.strategyStats.annualTurnover > 10) {
    flags.push("HIGH_TURNOVER");
  }

  if (result.trades.length < 5) {
    flags.push("THIN_DATA");
  }

  if (result.robustness.degradationPct < -0.5) {
    flags.push("OVERFIT_RISK");
  }

  result.flags = flags;
  return result;
}
