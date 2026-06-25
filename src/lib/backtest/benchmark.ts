// src/lib/backtest/benchmark.ts

import { Bar } from "./types";

export function generateBenchmark(bars: Bar[], initialCapital: number): number[] {
  if (bars.length === 0) return [];
  
  const curve: number[] = new Array(bars.length);
  const entryPrice = bars[0].open; // Buy at the open of the first active bar
  const shares = initialCapital / entryPrice;

  for (let i = 0; i < bars.length; i++) {
    // Value at the end of each day
    curve[i] = shares * bars[i].close;
  }

  return curve;
}
