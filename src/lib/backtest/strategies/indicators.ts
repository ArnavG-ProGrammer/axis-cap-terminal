// src/lib/backtest/strategies/indicators.ts

export function sma(data: number[], period: number): number[] {
  const result = new Array(data.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

export function ema(data: number[], period: number): number[] {
  const result = new Array(data.length).fill(NaN);
  if (data.length < period) return result;

  const k = 2 / (period + 1);
  let currentEma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = currentEma;

  for (let i = period; i < data.length; i++) {
    currentEma = data[i] * k + currentEma * (1 - k);
    result[i] = currentEma;
  }
  return result;
}

export function stdev(data: number[], period: number, smaValues: number[]): number[] {
  const result = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    const mean = smaValues[i];
    let sumSq = 0;
    for (let j = 0; j < period; j++) {
      sumSq += Math.pow(data[i - j] - mean, 2);
    }
    result[i] = Math.sqrt(sumSq / period); // Population stddev
  }
  return result;
}

export function atr(high: number[], low: number[], close: number[], period: number): number[] {
  const tr = new Array(high.length).fill(0);
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      tr[i] = high[i] - low[i];
    } else {
      tr[i] = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      );
    }
  }

  const result = new Array(high.length).fill(NaN);
  if (high.length < period) return result;

  let currentAtr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = currentAtr;

  for (let i = period; i < high.length; i++) {
    currentAtr = (currentAtr * (period - 1) + tr[i]) / period; // Wilder smoothing
    result[i] = currentAtr;
  }
  return result;
}

export function rsi(data: number[], period: number): number[] {
  const result = new Array(data.length).fill(NaN);
  if (data.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period; // Wilder smoothing
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }
  return result;
}

export function donchianHigh(data: number[], period: number): number[] {
  const result = new Array(data.length).fill(NaN);
  // max of high over the last N bars EXCLUDING t
  for (let i = period; i < data.length; i++) {
    let max = -Infinity;
    for (let j = 1; j <= period; j++) {
      if (data[i - j] > max) max = data[i - j];
    }
    result[i] = max;
  }
  return result;
}

export function donchianLow(data: number[], period: number): number[] {
  const result = new Array(data.length).fill(NaN);
  // min of low over the last M bars EXCLUDING t
  for (let i = period; i < data.length; i++) {
    let min = Infinity;
    for (let j = 1; j <= period; j++) {
      if (data[i - j] < min) min = data[i - j];
    }
    result[i] = min;
  }
  return result;
}
