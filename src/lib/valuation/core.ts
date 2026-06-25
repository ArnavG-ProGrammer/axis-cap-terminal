// /src/lib/valuation/core.ts

import { ValuationInputs, ValuationResult, ValuationMethod } from "./types";
import { getMacroRates, calculateWACC, calculateCostOfEquity } from "./rates";
import { unleverBeta, releverBeta, getSectorDefaultUnleveredBeta } from "./beta";
import { validateInputs, validateOutputs } from "./validate";
import { selectModel } from "./router";
import { runFCFF } from "./models/fcff";
import { runFCFE } from "./models/fcfe";
import { runResidualIncome } from "./models/residualIncome";
import { runDDMSustainable } from "./models/ddmSustainable";
import { runRevenueToFcf } from "./models/revenueToFcf";
import { runReverseDcf } from "./reverseDcf";
import { generateSensitivityGrid } from "./sensitivity";

/**
 * The single entry point for all valuations.
 * @param rawInputs The raw data fetched from Yahoo Finance or user overrides.
 * @param disableReverseDcf Used internally to prevent infinite loops during bisection.
 */
export function computeValuation(rawInputs: ValuationInputs, disableReverseDcf = false): ValuationResult {
  // 1. Determine geographic macro constraints
  const macro = getMacroRates(rawInputs.country);
  
  // 2. Validate and clean inputs
  const { cleanInputs, ctx } = validateInputs(rawInputs, macro);
  
  // 3. Setup Cost of Capital
  let rawBeta = cleanInputs.beta;
  if (!rawBeta || rawBeta <= 0) {
    rawBeta = getSectorDefaultUnleveredBeta(cleanInputs.sector, cleanInputs.industry);
    ctx.warnings.push(`Beta missing. Used sector default unlevered beta of ${rawBeta}.`);
  }
  
  // Assume raw beta from Yahoo is levered. We unlever it to get the asset risk, 
  // then re-lever it based on the exact capital structure.
  const debt = cleanInputs.totalDebt || 0;
  const equity = cleanInputs.marketCap || 0;
  
  const betaU = unleverBeta(rawBeta, debt, equity, macro.taxRate);
  const betaL = releverBeta(betaU, debt, equity, macro.taxRate);
  
  // Ke and WACC
  const ke = calculateCostOfEquity(macro.rf, betaL, macro.erp, macro.crp, 0);
  const kd = macro.rf + 0.015; // standard spread proxy
  let wacc = calculateWACC(equity, debt, ke, kd, macro.taxRate);
  
  // User WACC override
  if (cleanInputs.userWacc !== undefined) {
    wacc = cleanInputs.userWacc / 100;
  }
  
  // Growth
  let g1 = cleanInputs.userGrowthRate !== undefined 
    ? cleanInputs.userGrowthRate / 100 
    : (cleanInputs.revenueGrowth || 0.08); // fallback
  const gTerm = cleanInputs.userTgr !== undefined 
    ? cleanInputs.userTgr / 100 
    : macro.gdpCap;

  // 4. Select Route
  const method = selectModel(cleanInputs);
  
  // 5. Execute Model
  let result: ValuationResult;
  
  switch (method) {
    case "RIM":
      result = runResidualIncome(cleanInputs, ctx, ke, macro.currency);
      break;
    case "DDM_SUSTAINABLE":
      result = runDDMSustainable(cleanInputs, ctx, ke, macro.currency);
      break;
    case "REV_FCF":
      result = runRevenueToFcf(cleanInputs, ctx, wacc, macro.currency);
      break;
    case "FCFE":
      result = runFCFE(cleanInputs, ctx, ke, g1, gTerm, macro.currency);
      break;
    case "FCFF":
    default:
      result = runFCFF(cleanInputs, ctx, wacc, g1, gTerm, macro.currency);
      break;
  }

  // 6. Reverse DCF & Sensitivity (Only run if this isn't already a bisection call)
  if (!disableReverseDcf && cleanInputs.price > 0) {
    // Reverse DCF
    const rev = runReverseDcf((inputs) => computeValuation(inputs, true), cleanInputs, cleanInputs.price);
    result.reverseDCF = rev;
    
    // Sensitivity Grid
    const baseDiscount = method === "RIM" || method === "DDM_SUSTAINABLE" || method === "FCFE" ? ke : wacc;
    result.sensitivity = generateSensitivityGrid(
      (inputs) => computeValuation(inputs, true),
      cleanInputs,
      baseDiscount,
      gTerm
    );
  }

  // 7. Output Guardrails
  result = validateOutputs(result);

  return result;
}
