// src/lib/backtest/strategies/types.ts

import { Bar, Signal } from "../types";

export interface Strategy {
  name: string;
  // number of bars needed before the first valid signal can be produced
  warmup: number;
  // generates exactly one signal per bar in the array
  // generate(bars)[t] MUST depend only on bars[0..t]
  generate(bars: Bar[], params: Record<string, number | boolean>): Signal[];
}
