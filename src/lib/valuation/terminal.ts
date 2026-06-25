// /src/lib/valuation/terminal.ts

export interface TerminalResult {
  method: "gordon" | "exitMultiple";
  value: number;
  pv: number;
  pctOfEV: number;
}

/**
 * Calculates Terminal Value using the Gordon Growth Method.
 */
export function calculateGordonTerminal(
  finalFcf: number,
  discountRate: number,
  gTerm: number,
  years: number,
  midYear = false
): TerminalResult {
  // Ensure we don't divide by zero or negative if gTerm >= discountRate
  const denom = Math.max(discountRate - gTerm, 0.001);
  const value = (finalFcf * (1 + gTerm)) / denom;
  
  const discountPeriod = midYear ? years - 0.5 : years;
  const pv = value / Math.pow(1 + discountRate, discountPeriod);
  
  return {
    method: "gordon",
    value,
    pv,
    pctOfEV: 0 // Will be set later when EV is known
  };
}

/**
 * Calculates Terminal Value using the Exit Multiple Method (Cross-Check).
 */
export function calculateExitMultipleTerminal(
  finalEbitda: number,
  exitMultiple: number,
  discountRate: number,
  years: number,
  midYear = false
): TerminalResult {
  const value = finalEbitda * exitMultiple;
  
  const discountPeriod = midYear ? years - 0.5 : years;
  const pv = value / Math.pow(1 + discountRate, discountPeriod);
  
  return {
    method: "exitMultiple",
    value,
    pv,
    pctOfEV: 0
  };
}

/**
 * Verifies the divergence between the primary Gordon method and Exit Multiple.
 * Returns true if divergence > 25%.
 */
export function checkTerminalDivergence(gordon: TerminalResult, exit: TerminalResult): boolean {
  if (gordon.value === 0) return false;
  const div = Math.abs(gordon.value - exit.value) / gordon.value;
  return div > 0.25;
}
