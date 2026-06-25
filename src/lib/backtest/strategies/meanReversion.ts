// src/lib/backtest/strategies/meanReversion.ts

import { Bar, Signal } from "../types";
import { Strategy } from "./types";
import { sma, stdev, rsi, atr } from "./indicators";

export const meanReversion: Strategy = {
  name: "Mean Reversion",
  warmup: 200,

  generate(bars: Bar[], params: Record<string, number | boolean>): Signal[] {
    const closes = bars.map(b => b.close);
    const highs = bars.map(b => b.high);
    const lows = bars.map(b => b.low);

    const sma20 = sma(closes, 20);
    const sd20 = stdev(closes, 20, sma20);
    const rsi14 = rsi(closes, 14);
    const sma200 = sma(closes, 200);
    const atr14 = atr(highs, lows, closes, 14);

    const signals: Signal[] = new Array(closes.length).fill("FLAT");
    let position: "LONG" | "FLAT" = "FLAT";
    let entryPrice = 0;

    for (let i = this.warmup; i < closes.length; i++) {
      const curClose = closes[i];
      const lowerBand = sma20[i] - 2 * sd20[i];
      let newSignal: Signal = position;

      if (position === "LONG") {
        // Exit rule
        if (curClose >= sma20[i] || rsi14[i] > 55 || curClose < (entryPrice - 3 * atr14[i])) {
          newSignal = "FLAT";
        }
      } else {
        // Entry rule
        if (curClose < lowerBand && rsi14[i] < 30 && curClose > sma200[i]) {
          newSignal = "LONG";
          entryPrice = curClose;
        }
      }

      signals[i] = newSignal;
      position = newSignal;
    }

    return signals;
  }
};
