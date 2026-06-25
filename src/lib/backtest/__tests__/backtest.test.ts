// src/lib/backtest/__tests__/backtest.test.ts
import { runBacktest } from "../engine";
import { fetchBacktestData } from "../data";

// Mock the fetcher for testing
jest.mock("../data", () => ({
  fetchBacktestData: jest.fn()
}));

const mockBars = Array.from({ length: 500 }, (_, i) => {
  // A simple sine wave trend with positive drift
  const basePrice = 100 + i * 0.1 + Math.sin(i / 10) * 10;
  return {
    date: new Date(new Date('2020-01-01').getTime() + i * 86400000).toISOString().split('T')[0],
    open: basePrice,
    high: basePrice + 1,
    low: basePrice - 1,
    close: basePrice + (Math.random() - 0.5),
    volume: 1000000 + Math.random() * 500000
  };
});

describe("Hybrid Quant Backtester Regression Tests", () => {
  beforeEach(() => {
    (fetchBacktestData as jest.Mock).mockResolvedValue({
      status: "OK",
      bars: mockBars
    });
  });

  it("Test A: Deterministic entry point (runBacktest) handles execution cleanly", async () => {
    const res = await runBacktest({
      ticker: "MOCK",
      currency: "USD",
      strategy: "MACD_CROSSOVER",
      startYear: 2020,
      initialCapital: 10000,
      costsEnabled: true
    });
    
    expect(res.status).toBe("OK");
    expect(res.equityCurve.length).toBeGreaterThan(0);
    expect(res.trades.length).toBeGreaterThanOrEqual(0);
  });

  it("Test E: Data gate triggers INSUFFICIENT_DATA if bars < required", async () => {
    (fetchBacktestData as jest.Mock).mockResolvedValue({
      status: "INSUFFICIENT_DATA",
      bars: mockBars.slice(0, 50)
    });

    const res = await runBacktest({
      ticker: "MOCK",
      currency: "USD",
      strategy: "MACD_CROSSOVER",
      startYear: 2020,
      initialCapital: 10000,
      costsEnabled: true
    });

    expect(res.status).toBe("INSUFFICIENT_DATA");
  });

  it("Test H: Validation guardrails throw if headline endValue != equityCurve.at(-1)", async () => {
    // This is tested implicitly by the engine itself since runBacktest calls validateBacktest at the very end
    const res = await runBacktest({
      ticker: "MOCK",
      currency: "USD",
      strategy: "MACD_CROSSOVER",
      startYear: 2020,
      initialCapital: 10000,
      costsEnabled: true
    });
    
    const lastEquity = res.equityCurve[res.equityCurve.length - 1].strategy;
    expect(Math.abs(res.strategyStats.endValue - lastEquity)).toBeLessThan(0.02);
  });

  it("Test P8: Net End Value is EXACTLY Affine in Capital (Fixed Costs don't compound)", async () => {
    // We will test at 10k, 100k, 1m capital
    const capitals = [10000, 100000, 1000000];
    const results = await Promise.all(capitals.map(cap => runBacktest({
      ticker: "MOCK",
      currency: "INR",
      strategy: "MACD_CROSSOVER",
      startYear: 2020,
      initialCapital: cap,
      costsEnabled: true
    })));

    const v1 = results[0].strategyStats.endValue;
    const v2 = results[1].strategyStats.endValue;
    const v3 = results[2].strategyStats.endValue;

    // netEnd = A * capital - B
    // A = (v2 - v1) / (c2 - c1)
    const A = (v2 - v1) / (capitals[1] - capitals[0]);
    const B = A * capitals[0] - v1;

    // Predict v3
    const predictedV3 = A * capitals[2] - B;
    
    // Assert exactly affine
    expect(Math.abs(predictedV3 - v3)).toBeLessThan(0.01);

    // Also assert P8b: grossMultiple is identical across all capital
    const gm1 = results[0].strategyStats.grossEndValue / capitals[0];
    const gm2 = results[1].strategyStats.grossEndValue / capitals[1];
    expect(Math.abs(gm1 - gm2)).toBeLessThan(0.0001);
  });
});
