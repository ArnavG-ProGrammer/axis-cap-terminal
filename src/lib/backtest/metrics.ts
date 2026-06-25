// src/lib/backtest/metrics.ts

import { Trade } from "./types";

export function calculateMetrics(
  equityCurve: number[],
  grossCurve: number[],
  benchmarkCurve: number[],
  trades: Trade[],
  annualRf: number
) {
  const dailyReturns = calculateDailyReturns(equityCurve);
  const benchReturns = calculateDailyReturns(benchmarkCurve);

  const initial = equityCurve[0];
  const final = equityCurve[equityCurve.length - 1];
  const totalReturn = (final - initial) / initial;
  
  const years = equityCurve.length / 252;
  const cagr = Math.pow(final / initial, 1 / (years || 1)) - 1;

  // Gross metrics
  const grossInitial = grossCurve[0];
  const grossFinal = grossCurve[grossCurve.length - 1];
  const grossTotalReturn = (grossFinal - grossInitial) / grossInitial;
  const grossCagr = Math.pow(grossFinal / grossInitial, 1 / (years || 1)) - 1;

  const benchInitial = benchmarkCurve[0];
  const benchFinal = benchmarkCurve[benchmarkCurve.length - 1];
  const benchTotalReturn = (benchFinal - benchInitial) / benchInitial;
  const benchCagr = Math.pow(benchFinal / benchInitial, 1 / (years || 1)) - 1;

  const annualVol = Math.sqrt(variance(dailyReturns)) * Math.sqrt(252);
  const benchVol = Math.sqrt(variance(benchReturns)) * Math.sqrt(252);

  const sharpe = (cagr - annualRf) / (annualVol || 1);
  const benchSharpe = (benchCagr - annualRf) / (benchVol || 1);

  const downReturns = dailyReturns.filter(r => r < 0);
  const downsideDev = Math.sqrt(variance(downReturns)) * Math.sqrt(252);
  const sortino = (cagr - annualRf) / (downsideDev || 1);

  const maxDd = maxDrawdown(equityCurve);
  const calmar = cagr / Math.abs(maxDd.percent || 1);

  const beta = covariance(dailyReturns, benchReturns) / (variance(benchReturns) || 1);
  const jensenAlpha = cagr - (annualRf + beta * (benchCagr - annualRf));
  const excessCAGR = cagr - benchCagr;

  const diffReturns = dailyReturns.map((r, i) => r - benchReturns[i]);
  const ir = (mean(diffReturns) * 252) / (Math.sqrt(variance(diffReturns)) * Math.sqrt(252) || 1);

  const numTrades = trades.length;
  const winningTrades = trades.filter(t => t.returnPct > 0);
  const losingTrades = trades.filter(t => t.returnPct <= 0);
  const winRate = numTrades > 0 ? winningTrades.length / numTrades : 0;

  const grossWins = winningTrades.reduce((sum, t) => sum + t.returnPct, 0);
  const grossLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.returnPct, 0));
  const profitFactor = grossLosses === 0 ? (grossWins > 0 ? 99 : 0) : grossWins / grossLosses;

  const avgWin = winningTrades.length > 0 ? grossWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? -grossLosses / losingTrades.length : 0;
  const expectancy = (winRate * avgWin) - ((1 - winRate) * Math.abs(avgLoss));

  const totalDaysInMarket = trades.reduce((sum, t) => sum + t.holdingDays, 0);
  const avgHoldingDays = numTrades > 0 ? totalDaysInMarket / numTrades : 0;
  const exposurePct = totalDaysInMarket / equityCurve.length;

  const annualTurnover = exposurePct * (numTrades / (years || 1));

  // Affine Cost Math
  const totalVariableCosts = trades.reduce((sum, t) => sum + t.variableCosts, 0);
  const totalFixedCosts = trades.reduce((sum, t) => sum + t.fixedCosts, 0);
  const totalCosts = totalVariableCosts + totalFixedCosts;

  const variableDragPct = totalVariableCosts / initial;
  const fixedDragPct = totalFixedCosts / initial;
  const costPerRoundTripPct = numTrades > 0 ? (totalVariableCosts / initial) / numTrades : 0; 
  // Wait, variable cost per round trip is totalVar / totalNotional, but we mock it against initial for drag metrics

  // breakEvenCapital = B / (A - 1)
  // A = grossMultiple - variableDragFraction
  // B = totalFixedCosts
  const A = (grossFinal / grossInitial) - variableDragPct;
  const B = totalFixedCosts;
  
  let breakEvenCapital = 0;
  if (A > 1) {
    breakEvenCapital = B / (A - 1);
  }

  const costDragCagr = grossCagr - cagr;

  let winner: "STRATEGY" | "BUY_AND_HOLD" = "BUY_AND_HOLD";
  let reason = "";

  if (sharpe > benchSharpe && excessCAGR > 0) {
    winner = "STRATEGY";
    reason = "Strategy beat benchmark on absolute return and risk-adjusted basis.";
  } else if (sharpe > benchSharpe) {
    reason = "Strategy had better risk-adjusted returns, but lagged in absolute return.";
  } else {
    reason = "Strategy failed to beat the benchmark.";
  }

  const flags: string[] = [];
  if (totalCosts > 0 && totalFixedCosts > 0.25 * totalCosts) {
    flags.push("FIXED_COST_HEAVY");
  }
  if (cagr <= 0 && grossCagr > 0) {
    flags.push("COSTS_EXCEED_EDGE");
  }

  return {
    strategyStats: {
      grossEndValue: grossFinal,
      grossTotalReturn,
      grossCagr,
      endValue: final,
      totalReturn,
      cagr,
      costDragCagr,
      annualVol,
      sharpe,
      sortino,
      calmar,
      maxDrawdown: maxDd.percent,
      maxDrawdownDurationDays: maxDd.duration,
      exposurePct,
      beta,
      jensenAlpha,
      excessCAGR,
      informationRatio: ir,
      numTrades,
      winRate,
      profitFactor,
      expectancy,
      avgHoldingDays,
      annualTurnover,
      costs: {
        total: totalCosts,
        variableCosts: totalVariableCosts,
        fixedCosts: totalFixedCosts,
        variableDragPct,
        fixedDragPct,
        costPerRoundTripPct,
        breakEvenCapital
      }
    },
    benchmark: {
      endValue: benchFinal,
      totalReturn: benchTotalReturn,
      cagr: benchCagr,
      maxDrawdown: maxDrawdown(benchmarkCurve).percent,
      sharpe: benchSharpe
    },
    verdict: {
      winner,
      reason
    },
    costFlags: flags
  };
}

// Math Helpers

function calculateDailyReturns(curve: number[]): number[] {
  const returns = new Array(curve.length).fill(0);
  for (let i = 1; i < curve.length; i++) {
    returns[i] = (curve[i] - curve[i - 1]) / curve[i - 1];
  }
  return returns;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
}

function covariance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const ma = mean(a);
  const mb = mean(b);
  let cov = 0;
  for (let i = 0; i < a.length; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
  }
  return cov / a.length;
}

function maxDrawdown(curve: number[]): { percent: number, duration: number } {
  let peak = curve[0];
  let maxDd = 0;
  let currentDuration = 0;
  let maxDuration = 0;

  for (let i = 1; i < curve.length; i++) {
    if (curve[i] > peak) {
      peak = curve[i];
      currentDuration = 0;
    } else {
      currentDuration++;
      if (currentDuration > maxDuration) {
        maxDuration = currentDuration;
      }
      const dd = (curve[i] - peak) / peak;
      if (dd < maxDd) {
        maxDd = dd;
      }
    }
  }

  return { percent: maxDd, duration: maxDuration };
}
