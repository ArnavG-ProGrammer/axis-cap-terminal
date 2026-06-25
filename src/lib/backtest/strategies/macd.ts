// src/lib/backtest/strategies/macd.ts

import { Bar, Signal } from "../types";
import { Strategy } from "./types";
import { ema, sma } from "./indicators";

export const macdCrossover: Strategy = {
  name: "MACD Crossover",
  warmup: 200,

  generate(bars: Bar[], params: Record<string, number | boolean>): Signal[] {
    const closes = bars.map(b => b.close);
    const filterOn = params.trendFilter !== false;
    
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    
    const macdLine = new Array(closes.length).fill(NaN);
    for (let i = 25; i < closes.length; i++) {
      macdLine[i] = ema12[i] - ema26[i];
    }
    
    // EMA9 of MACD line
    const k = 2 / (9 + 1);
    const signalLine = new Array(closes.length).fill(NaN);
    
    // Need 9 periods of MACD to start signal line
    let firstValidMacdIdx = 25;
    if (closes.length > firstValidMacdIdx + 9) {
      let currentSignalEma = macdLine.slice(firstValidMacdIdx, firstValidMacdIdx + 9).reduce((a, b) => a + b, 0) / 9;
      signalLine[firstValidMacdIdx + 8] = currentSignalEma;
      for (let i = firstValidMacdIdx + 9; i < closes.length; i++) {
        currentSignalEma = macdLine[i] * k + currentSignalEma * (1 - k);
        signalLine[i] = currentSignalEma;
      }
    }

    const sma200 = sma(closes, 200);
    const signals: Signal[] = new Array(closes.length).fill("FLAT");
    
    let position: "LONG" | "FLAT" = "FLAT";

    for (let i = this.warmup; i < closes.length; i++) {
      const prevMacd = macdLine[i - 1];
      const prevSig = signalLine[i - 1];
      const curMacd = macdLine[i];
      const curSig = signalLine[i];
      const curClose = closes[i];
      const curSma200 = sma200[i];

      let newSignal: Signal = position;

      // Entry rule
      if (position === "FLAT" && prevMacd <= prevSig && curMacd > curSig) {
        if (!filterOn || curClose > curSma200) {
          newSignal = "LONG";
        }
      } 
      // Exit rule
      else if (position === "LONG" && prevMacd >= prevSig && curMacd < curSig) {
        newSignal = "FLAT";
      }

      signals[i] = newSignal;
      position = newSignal;
    }

    return signals;
  }
};
