// src/lib/backtest/strategies/breakout.ts

import { Bar, Signal } from "../types";
import { Strategy } from "./types";
import { donchianHigh, donchianLow, sma, atr } from "./indicators";

export const momentumBreakout: Strategy = {
  name: "Momentum Breakout",
  warmup: 56, // max(55, 10, 20) + 1

  generate(bars: Bar[], params: Record<string, number | boolean>): Signal[] {
    const closes = bars.map(b => b.close);
    const highs = bars.map(b => b.high);
    const lows = bars.map(b => b.low);
    const volumes = bars.map(b => b.volume);

    const N = (params.N as number) || 20;
    const M = (params.M as number) || 10;
    
    const dHigh = donchianHigh(highs, N);
    const dLow = donchianLow(lows, M);
    const volSma20 = sma(volumes, 20);
    const atr14 = atr(highs, lows, closes, 14);

    const signals: Signal[] = new Array(closes.length).fill("FLAT");
    let position: "LONG" | "FLAT" = "FLAT";
    let highestCloseSinceEntry = -Infinity;

    for (let i = this.warmup; i < closes.length; i++) {
      const curClose = closes[i];
      const curVol = volumes[i];
      let newSignal: Signal = position;

      if (position === "LONG") {
        highestCloseSinceEntry = Math.max(highestCloseSinceEntry, curClose);
        // Exit rule
        if (curClose < dLow[i] || curClose < (highestCloseSinceEntry - 3 * atr14[i])) {
          newSignal = "FLAT";
          highestCloseSinceEntry = -Infinity;
        }
      } else {
        // Entry rule
        if (curClose > dHigh[i]) {
          const isVolBurst = curVol > 1.5 * volSma20[i];
          const isAtrBurst = (highs[i] - lows[i]) > 1.5 * atr14[i]; // Rough proxy for TR burst
          
          if (isVolBurst || isAtrBurst) {
            newSignal = "LONG";
            highestCloseSinceEntry = curClose;
          }
        }
      }

      signals[i] = newSignal;
      position = newSignal;
    }

    return signals;
  }
};
