// /src/lib/valuation/rates.ts

export interface RateConfig {
  rf: number;
  erp: number;
  crp: number;
  taxRate: number;
  gdpCap: number;
  currency: "USD" | "INR";
}

// In a real application, these would be fetched dynamically or updated quarterly.
// Using the specific mid-2026 baselines from the user's prompt.
const MACRO_CONFIGS: Record<string, RateConfig> = {
  US: {
    rf: 0.042, // Live 10Y Treasury anchor ~4.2%
    erp: 0.05, // 5.0%
    crp: 0,
    taxRate: 0.21,
    gdpCap: 0.035, // 3.5%
    currency: "USD",
  },
  IN: {
    rf: 0.07,  // Live 10Y G-Sec anchor ~7.0%
    erp: 0.05, // Mature ERP
    crp: 0.03, // India CRP ~3.0% (Total equity risk ~8.0%)
    taxRate: 0.2517, // New concessional regime
    gdpCap: 0.055, // 5.5%
    currency: "INR",
  }
};

export function getMacroRates(country: string): RateConfig {
  const code = country.toUpperCase();
  if (code === "INDIA" || code === "IN") return MACRO_CONFIGS.IN;
  return MACRO_CONFIGS.US; // Default to US
}

export function calculateCostOfEquity(rf: number, betaLevered: number, erp: number, crp: number, sizePremium = 0): number {
  return rf + (betaLevered * erp) + crp + sizePremium;
}

export function calculateWACC(
  equityValue: number, 
  debtValue: number, 
  ke: number, 
  kd: number, 
  taxRate: number
): number {
  const v = equityValue + debtValue;
  if (v <= 0) return ke;
  
  const we = equityValue / v;
  const wd = debtValue / v;
  
  return (we * ke) + (wd * kd * (1 - taxRate));
}

// Fallback cost of debt estimator based on risk-free rate
export function estimateCostOfDebt(rf: number, isHighYield = false): number {
  return isHighYield ? rf + 0.04 : rf + 0.015;
}
