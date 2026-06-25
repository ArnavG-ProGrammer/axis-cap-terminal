// /src/lib/valuation/validate.ts

import { ValuationInputs, ValuationResult } from "./types";
import { RateConfig } from "./rates";

export interface ValidationContext {
  flags: string[];
  warnings: string[];
  dataQuality: {
    source: string;
    confidence: "high" | "medium" | "low";
    fcfMethod?: string;
  };
}

export function validateInputs(
  inputs: ValuationInputs,
  macro: RateConfig
): { cleanInputs: ValuationInputs; ctx: ValidationContext } {
  const ctx: ValidationContext = {
    flags: [],
    warnings: [],
    dataQuality: { source: "Yahoo Finance", confidence: "high" }
  };

  const clean = { ...inputs };

  // 1. Consistency Checks
  if (clean.price > 0 && clean.sharesOutstanding > 0 && clean.marketCap > 0) {
    const impliedCap = clean.price * clean.sharesOutstanding;
    if (Math.abs(clean.marketCap - impliedCap) / clean.marketCap > 0.05) {
      ctx.warnings.push("Market Cap is inconsistent with Price * Shares.");
      ctx.dataQuality.confidence = "medium";
      // Fix the market cap to match price * shares as price is usually the most live data point
      clean.marketCap = impliedCap;
    }
  }

  // 2. FCF Derivation if Missing or Invalid
  if (!clean.fcf || clean.fcf === 0) {
    ctx.dataQuality.confidence = "medium";
    
    // Attempt derivation 1: Net Income Proxy (Standard ~80% FCF conversion)
    if (clean.netIncome && clean.netIncome > 0) {
      clean.fcf = clean.netIncome * 0.8;
      ctx.dataQuality.fcfMethod = "Derived from Net Income (80% proxy)";
      ctx.warnings.push("FCF was missing. Derived using standard Net Income conversion.");
    } else {
      ctx.dataQuality.confidence = "low";
      ctx.dataQuality.fcfMethod = "Fabricated (No Net Income available)";
      ctx.warnings.push("CRITICAL: FCF missing and cannot be derived cleanly.");
    }
  } else {
    // Sanity check FCF vs Net Income
    if (clean.netIncome && clean.netIncome > 0) {
      const conversion = clean.fcf / clean.netIncome;
      if (conversion > 2.5) {
         ctx.flags.push("FCF_ANOMALY: FCF > 2.5x Net Income");
         ctx.dataQuality.confidence = "medium";
      }
    }
  }

  // 3. Rate & Bound Guards (Hard Stops - Clamp + Warn)
  let baseG1 = clean.userGrowthRate ?? (clean.revenueGrowth * 100);
  if (baseG1 === 0) baseG1 = 8; // fallback
  
  if (clean.userTgr !== undefined) {
    if (clean.userTgr > macro.gdpCap * 100) {
      ctx.warnings.push(`TGR ${clean.userTgr}% clamped to GDP cap ${macro.gdpCap * 100}%.`);
      clean.userTgr = macro.gdpCap * 100;
    }
    if (clean.userTgr > baseG1) {
      ctx.warnings.push(`TGR clamped to not exceed Stage 1 growth of ${baseG1}%.`);
      clean.userTgr = baseG1;
    }
  } else {
    clean.userTgr = Math.min(macro.gdpCap * 100, baseG1);
  }

  return { cleanInputs: clean, ctx };
}

export function validateOutputs(result: ValuationResult): ValuationResult {
  // TERMINAL_HEAVY check
  if (result.terminal.pctOfEV > 0.85) {
    result.flags.push("TERMINAL_HEAVY: >85% of value relies on perpetuity assumption");
  }

  // LARGE_DIVERGENCE check
  if (result.upsideDownsidePct > 60 || result.upsideDownsidePct < -60) {
    result.flags.push("LARGE_DIVERGENCE: Intrinsic value deviates >60% from market");
  }

  return result;
}
