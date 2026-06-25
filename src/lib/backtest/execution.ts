// src/lib/backtest/execution.ts

import { Bar, Signal, Trade } from "./types";

export interface ExecutionOptions {
  currency: "USD" | "INR";
  costsEnabled: boolean;
  initialCapital: number;
}

export function executeTrades(bars: Bar[], signals: Signal[], options: ExecutionOptions) {
  const trades: Trade[] = [];
  
  const equityCurve: number[] = new Array(bars.length).fill(options.initialCapital);
  const grossCurve: number[] = new Array(bars.length).fill(options.initialCapital);
  
  let position: "LONG" | "FLAT" | "SHORT" = "FLAT";
  let cash = options.initialCapital;
  let grossCash = options.initialCapital;
  
  let shares = 0;
  let grossShares = 0;
  
  let entryDate = "";
  let entryPx = 0;
  let entryIndex = -1;
  let entryVariableCost = 0;
  let entryFixedCost = 0;

  const annualRf = options.currency === "USD" ? 0.043 : 0.065;
  const dailyRf = annualRf / 252;

  const slippageBps = options.currency === "USD" ? 5 : 10;
  const slippageMultiplierLongEntry = 1 + slippageBps / 10000;
  const slippageMultiplierLongExit = 1 - slippageBps / 10000;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    
    if (position === "FLAT" && i > 0) {
      cash *= (1 + dailyRf);
      grossCash *= (1 + dailyRf);
    }

    const targetSignal = i > 0 ? signals[i - 1] : "FLAT";

    if (position !== targetSignal) {
      if (targetSignal === "LONG" && position === "FLAT") {
        // ENTRY LONG
        const fillPrice = bar.open * slippageMultiplierLongEntry;
        const grossFillPrice = bar.open; // Gross execution implies no slippage and no commissions
        
        // Net Execution
        const notional = cash;
        const costs = calculateCosts(notional, options.currency, "BUY", options.costsEnabled);
        // We deduct variable first, then fixed. Actually, the formula is:
        const executableNotional = notional - costs.variable - costs.fixed;
        shares = executableNotional / fillPrice;
        
        // Gross Execution
        grossShares = grossCash / grossFillPrice;
        
        entryPx = fillPrice;
        entryVariableCost = costs.variable;
        entryFixedCost = costs.fixed;
        entryDate = bar.date;
        entryIndex = i;
        
        cash = 0;
        grossCash = 0;
        position = "LONG";
      } 
      else if (targetSignal === "FLAT" && position === "LONG") {
        // EXIT LONG
        const fillPrice = bar.open * slippageMultiplierLongExit;
        const grossFillPrice = bar.open;
        
        // Net Execution
        const notional = shares * fillPrice;
        const costs = calculateCosts(notional, options.currency, "SELL", options.costsEnabled);
        const netProceeds = notional - costs.variable - costs.fixed;
        
        // Gross Execution
        grossCash = grossShares * grossFillPrice;
        
        const totalVar = entryVariableCost + costs.variable;
        const totalFixed = entryFixedCost + costs.fixed;
        
        const returnPct = ((netProceeds - (entryPx * shares + entryVariableCost + entryFixedCost)) / (entryPx * shares + entryVariableCost + entryFixedCost));
        
        trades.push({
          entryDate,
          exitDate: bar.date,
          entryPx,
          exitPx: fillPrice,
          returnPct,
          holdingDays: i - entryIndex,
          variableCosts: totalVar,
          fixedCosts: totalFixed,
          side: "LONG"
        });

        cash = netProceeds;
        shares = 0;
        grossShares = 0;
        position = "FLAT";
      }
    }

    // Mark to market
    if (position === "LONG") {
      equityCurve[i] = shares * bar.close;
      grossCurve[i] = grossShares * bar.close;
    } else {
      equityCurve[i] = cash;
      grossCurve[i] = grossCash;
    }
  }

  // Force close any open position at the very end
  if (position === "LONG") {
    const lastBar = bars[bars.length - 1];
    const fillPrice = lastBar.close * slippageMultiplierLongExit;
    const grossFillPrice = lastBar.close;
    
    const notional = shares * fillPrice;
    const costs = calculateCosts(notional, options.currency, "SELL", options.costsEnabled);
    const netProceeds = notional - costs.variable - costs.fixed;
    
    grossCash = grossShares * grossFillPrice;
    
    const totalVar = entryVariableCost + costs.variable;
    const totalFixed = entryFixedCost + costs.fixed;
    const returnPct = ((netProceeds - (entryPx * shares + entryVariableCost + entryFixedCost)) / (entryPx * shares + entryVariableCost + entryFixedCost));

    trades.push({
      entryDate,
      exitDate: lastBar.date,
      entryPx,
      exitPx: fillPrice,
      returnPct,
      holdingDays: bars.length - 1 - entryIndex,
      variableCosts: totalVar,
      fixedCosts: totalFixed,
      side: "LONG"
    });
    
    cash = netProceeds;
    equityCurve[equityCurve.length - 1] = cash;
    grossCurve[grossCurve.length - 1] = grossCash;
  }

  return { trades, equityCurve, grossCurve };
}

function calculateCosts(notional: number, currency: "USD" | "INR", side: "BUY" | "SELL", enabled: boolean): { variable: number, fixed: number } {
  if (!enabled) return { variable: 0, fixed: 0 };

  if (currency === "USD") {
    // US Equity Defaults
    // retail default: 0 commission (fixed)
    let fixed = 0;
    let variable = 0;
    if (side === "SELL") {
      variable += notional * 0.0000278; // SEC fee 0.00278%
      // TAF is per share, we don't have shares exactly here for US, so we mock it as a tiny variable fee
      variable += notional * 0.000005; // mock FINRA TAF
    }
    return { variable, fixed };
  } else {
    // INDIA Delivery (Discount Broker)
    // Brokerage: delivery is 0%, cap 0
    const brokerage = 0;
    const stt = notional * 0.001; // 0.1% on buy and sell
    const exchange = notional * 0.0000297;
    const sebi = notional * 0.000001;
    const gst = (brokerage + exchange + sebi) * 0.18; // GST is on brokerage + exchange + SEBI
    const stampDuty = side === "BUY" ? notional * 0.00015 : 0;
    
    const variable = brokerage + stt + exchange + sebi + gst + stampDuty;
    
    // DP Charge on SELL leg: Rs 15.93 per scrip
    const fixed = side === "SELL" ? 15.93 : 0;
    
    return { variable, fixed };
  }
}
