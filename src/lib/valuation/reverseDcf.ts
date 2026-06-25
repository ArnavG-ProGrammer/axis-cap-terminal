// /src/lib/valuation/reverseDcf.ts

import { ValuationInputs, ValuationResult } from "./types";

export type ComputeFn = (inputs: ValuationInputs) => ValuationResult;

export function runReverseDcf(
  compute: ComputeFn,
  inputs: ValuationInputs,
  targetPrice: number
) {
  if (targetPrice <= 0 || inputs.sharesOutstanding <= 0) {
    return {
      impliedG1: 0,
      vsHistoricalGrowth: 0,
      vsAnalystGrowth: null,
      vsSectorMedian: null,
      verdict: "Cannot compute Reverse DCF: Invalid price or shares."
    };
  }

  // Bisection to find implied g1
  let lo = -0.20; // -20%
  let hi = 0.60;  // +60%
  let mid = 0;

  for (let i = 0; i < 40; i++) {
    mid = (lo + hi) / 2;
    
    // Create a clone of inputs with the overridden growth rate
    const testInputs = { ...inputs, userGrowthRate: mid * 100 };
    
    // We suppress the recursive reverse DCF call inside compute by passing a flag if necessary,
    // but in core.ts we'll just guard against infinite loops by ensuring computeValuation doesn't
    // call reverseDcf if a flag is set, or we extract the pure math.
    // For now, assume compute() is safe.
    try {
      const v = compute(testInputs);
      if (v.perShare < targetPrice) {
        lo = mid;
      } else {
        hi = mid;
      }
    } catch (e) {
      // If the model blows up, break
      break;
    }
  }

  const impliedG1 = mid;
  const hist = (inputs.revenueGrowth || 0); // proxy
  const vsHist = impliedG1 - hist;

  let verdict = "";
  if (vsHist > 0.15) {
    verdict = `Market implies ${(impliedG1*100).toFixed(1)}% growth, significantly higher than historical ${(hist*100).toFixed(1)}%. Stock appears very rich.`;
  } else if (vsHist < -0.05) {
    verdict = `Market implies ${(impliedG1*100).toFixed(1)}% growth, lower than historical ${(hist*100).toFixed(1)}%. Stock appears discounted.`;
  } else {
    verdict = `Market implied growth of ${(impliedG1*100).toFixed(1)}% is roughly in-line with historicals. Fairly valued.`;
  }

  return {
    impliedG1,
    vsHistoricalGrowth: vsHist,
    vsAnalystGrowth: null,
    vsSectorMedian: null,
    verdict
  };
}
