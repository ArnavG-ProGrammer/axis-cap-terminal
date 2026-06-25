// src/lib/backtest/engine.ts

import { BacktestParams, BacktestResult, Bar, Signal } from "./types";
import { fetchBacktestData } from "./data";
import { generateBenchmark } from "./benchmark";
import { executeTrades } from "./execution";
import { calculateMetrics } from "./metrics";
import { runMonteCarlo, runWalkForward } from "./walkForward";
import { validateBacktest } from "./validate";
import { macdCrossover } from "./strategies/macd";
import { momentumBreakout } from "./strategies/breakout";
import { meanReversion } from "./strategies/meanReversion";
import { Strategy } from "./strategies/types";

export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  let strategyImpl: Strategy;
  
  switch (params.strategy) {
    case "MOMENTUM_BREAKOUT":
      strategyImpl = momentumBreakout;
      break;
    case "MEAN_REVERSION":
      strategyImpl = meanReversion;
      break;
    case "MACD_CROSSOVER":
    default:
      strategyImpl = macdCrossover;
      break;
  }

  // 1. Determine required bars (warmup + at least 1 trading year)
  const requiredBars = strategyImpl.warmup + 252;

  // 2. Fetch / slice data
  // Since we fetch on the fly here, engine must be async. 
  // It handles its own Indian suffix resolution and returns an OK or INSUFFICIENT_DATA status.
  const dataRes = await fetchBacktestData(params.ticker, requiredBars);
  const bars = dataRes.bars;

  const baseResult: BacktestResult = {
    ticker: params.ticker,
    currency: params.currency,
    strategy: params.strategy,
    params: params.params || {},
    status: dataRes.status,
    window: { 
      entryYear: params.startYear, 
      startDate: bars.length > 0 ? bars[0].date : "", 
      endDate: bars.length > 0 ? bars[bars.length - 1].date : "", 
      bars: bars.length 
    },
    equityCurve: [],
    trades: [],
    benchmark: { endValue: 0, totalReturn: 0, cagr: 0, maxDrawdown: 0, sharpe: 0 },
    strategyStats: {
      grossEndValue: 0, grossTotalReturn: 0, grossCagr: 0,
      endValue: 0, totalReturn: 0, cagr: 0, costDragCagr: 0, annualVol: 0, sharpe: 0, sortino: 0, calmar: 0,
      maxDrawdown: 0, maxDrawdownDurationDays: 0, exposurePct: 0, beta: 0, jensenAlpha: 0, 
      excessCAGR: 0, informationRatio: 0, numTrades: 0, winRate: 0, profitFactor: 0, expectancy: 0,
      avgHoldingDays: 0, annualTurnover: 0, 
      costs: {
        total: 0, variableCosts: 0, fixedCosts: 0, variableDragPct: 0, fixedDragPct: 0, costPerRoundTripPct: 0, breakEvenCapital: 0
      }
    },
    robustness: {
      inSampleCagr: 0, outOfSampleCagr: 0, degradationPct: 0,
      monteCarlo: { cagrP5: 0, cagrP50: 0, cagrP95: 0, maxDdP95: 0 }
    },
    verdict: { winner: "BUY_AND_HOLD", reason: "" },
    flags: []
  };

  // DEFECT 1: If data is insufficient, bail cleanly. UI will render the error state.
  if (dataRes.status === "INSUFFICIENT_DATA") {
    return baseResult;
  }

  // Filter bars to start around the requested startYear if we have more than enough data
  // Wait, if startYear is provided, we should ideally slice the array to exactly from that year's start.
  const startDateThreshold = `${params.startYear}-01-01`;
  let backtestStartIndex = bars.findIndex(b => b.date >= startDateThreshold);
  
  if (backtestStartIndex === -1 || (bars.length - backtestStartIndex) < 252) {
      // If slicing would ruin the minimum 1 year backtest, just use the required trailing bars.
      backtestStartIndex = Math.max(0, bars.length - Math.max(252, (new Date().getFullYear() - params.startYear) * 252));
  }

  // Ensure we keep the warmup bars before the backtest start index
  const absoluteStartIndex = Math.max(0, backtestStartIndex - strategyImpl.warmup);
  const slicedBars = bars.slice(absoluteStartIndex);

  // 3. Generate Signals (without look-ahead, generate function only looks backwards)
  const rawSignals = strategyImpl.generate(slicedBars, params.params || {});

  // Align signals and bars for execution, discarding warmup period
  const activeBars = slicedBars.slice(strategyImpl.warmup);
  const activeSignals = rawSignals.slice(strategyImpl.warmup);

  if (activeBars.length === 0) {
      baseResult.status = "INSUFFICIENT_DATA";
      return baseResult;
  }

  // 4. Generate Benchmark
  const benchmarkCurve = generateBenchmark(activeBars, params.initialCapital);

  // 5. Execute Trades with Lag and Costs
  const { trades, equityCurve, grossCurve } = executeTrades(activeBars, activeSignals, {
    currency: params.currency,
    costsEnabled: params.costsEnabled !== false,
    initialCapital: params.initialCapital
  });

  // Combine curves
  const combinedCurve = activeBars.map((b, i) => ({
    date: b.date,
    strategy: equityCurve[i],
    strategyGross: grossCurve[i],
    benchmark: benchmarkCurve[i]
  }));

  baseResult.equityCurve = combinedCurve;
  baseResult.trades = trades;

  // 6. Metrics Calculation
  const annualRf = params.currency === "USD" ? 0.043 : 0.065;
  const metrics = calculateMetrics(equityCurve, grossCurve, benchmarkCurve, trades, annualRf);

  baseResult.benchmark = metrics.benchmark;
  baseResult.strategyStats = metrics.strategyStats;
  baseResult.verdict = metrics.verdict;
  baseResult.flags = metrics.costFlags;

  // 7. Robustness
  const mc = runMonteCarlo(trades, params.initialCapital);
  const wf = runWalkForward();
  
  baseResult.robustness = {
    ...wf,
    monteCarlo: mc
  };

  // 8. Validation Guardrails
  return validateBacktest(baseResult);
}
