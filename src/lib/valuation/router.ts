// /src/lib/valuation/router.ts

import { ValuationInputs, ValuationMethod } from "./types";

export function selectModel(inputs: ValuationInputs): ValuationMethod {
  const s = inputs.sector?.toLowerCase() || "";
  const i = inputs.industry?.toLowerCase() || "";
  
  // 1. Financials -> RIM
  if (
    s.includes("financial") || 
    i.includes("bank") || 
    i.includes("insurance") || 
    i.includes("capital market") ||
    i.includes("credit")
  ) {
    return "RIM";
  }

  // 2. REITs -> DDM
  if (s.includes("real estate") || i.includes("reit")) {
    return "DDM_SUSTAINABLE";
  }

  // 3. Utilities with high payout -> DDM
  if (s.includes("utilities") && inputs.payoutRatio && inputs.payoutRatio > 0.6) {
    return "DDM_SUSTAINABLE";
  }

  // 4. Pre-profit / Hyper-growth -> REV_FCF
  // If FCF is negative, OR if revenue growth is massive (>25%) and margins are thin (<5%)
  const margin = inputs.revenue > 0 ? inputs.netIncome / inputs.revenue : 0;
  if (
    (!inputs.fcf || inputs.fcf <= 0) || 
    (inputs.revenueGrowth > 0.25 && margin < 0.05)
  ) {
    return "REV_FCF";
  }

  // 5. Default -> FCFF (Unlevered DCF)
  return "FCFF";
}
