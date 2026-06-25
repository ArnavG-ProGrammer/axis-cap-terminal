// /src/lib/valuation/beta.ts

/**
 * Re-lever an unlevered beta for a specific capital structure.
 */
export function releverBeta(
  betaUnlevered: number,
  debt: number,
  equity: number,
  taxRate: number
): number {
  if (equity <= 0) return betaUnlevered;
  const deRatio = debt / equity;
  return betaUnlevered * (1 + (1 - taxRate) * deRatio);
}

/**
 * Unlever a raw levered beta using the firm's capital structure.
 */
export function unleverBeta(
  betaLevered: number,
  debt: number,
  equity: number,
  taxRate: number
): number {
  if (equity <= 0) return betaLevered;
  const deRatio = debt / equity;
  return betaLevered / (1 + (1 - taxRate) * deRatio);
}

/**
 * Provide sector-specific default unlevered betas if no beta is available.
 */
export function getSectorDefaultUnleveredBeta(sector: string, industry: string): number {
  const s = sector.toLowerCase();
  const i = industry.toLowerCase();

  if (s.includes('technology') || s.includes('software') || s.includes('internet')) return 1.15;
  if (s.includes('consumer defensive') || s.includes('staples')) return 0.6;
  if (s.includes('utilities')) return 0.4;
  if (s.includes('energy') || s.includes('materials') || s.includes('mining')) return 1.05;
  if (s.includes('real estate') || s.includes('reit')) return 0.55;
  if (s.includes('healthcare') || s.includes('pharma')) return 1.05;
  if (s.includes('financial') || i.includes('bank') || i.includes('insurance')) return 1.0; // Banks typically aren't valued via unlevered beta, but as a fallback
  if (s.includes('auto')) return 1.3;
  
  return 1.0; // Market average
}
