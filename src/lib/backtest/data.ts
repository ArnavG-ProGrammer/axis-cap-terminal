// src/lib/backtest/data.ts

import { Bar } from "./types";

const cache = new Map<string, Bar[]>();

export async function fetchBacktestData(ticker: string, requiredBars: number): Promise<{ status: "OK" | "INSUFFICIENT_DATA", bars: Bar[] }> {
  // If we already resolved and cached the OHLCV for this ticker, use it
  if (cache.has(ticker)) {
    const bars = cache.get(ticker)!;
    if (bars.length >= requiredBars) {
      return { status: "OK", bars };
    } else {
      return { status: "INSUFFICIENT_DATA", bars };
    }
  }

  // Attempt fetch. For India, we might need suffixes if the base ticker fails or returns thin data.
  const candidates = [ticker, `${ticker}.NS`, `${ticker}.BO`];
  let bestBars: Bar[] = [];

  for (const cand of candidates) {
    try {
      const res = await fetch(`/api/quote?q=${encodeURIComponent(cand)}`);
      if (!res.ok) continue;
      const data = await res.json();
      
      const hist = data.historicalPrices || [];
      if (hist.length > bestBars.length) {
        bestBars = hist.map((h: any) => ({
          date: h.date,
          open: h.open,
          high: h.high,
          low: h.low,
          close: h.price, // in route.ts, it maps h.close or h.adjClose to 'price'
          volume: h.volume
        })).sort((a: Bar, b: Bar) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      // If we got enough data, stop looking for fallbacks
      if (bestBars.length >= requiredBars) {
        break;
      }
    } catch (e) {
      console.warn(`Failed to fetch ${cand} for backtest data:`, e);
    }
  }

  cache.set(ticker, bestBars);

  if (bestBars.length >= requiredBars) {
    return { status: "OK", bars: bestBars };
  } else {
    return { status: "INSUFFICIENT_DATA", bars: bestBars };
  }
}
