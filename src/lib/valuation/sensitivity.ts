// /src/lib/valuation/sensitivity.ts

import { ValuationInputs, ValuationResult } from "./types";
import { ComputeFn } from "./reverseDcf";

export function generateSensitivityGrid(
  compute: ComputeFn,
  inputs: ValuationInputs,
  baseWacc: number,
  baseTgr: number
): number[][] {
  const waccSteps = [-0.01, -0.005, 0, 0.005, 0.01];
  const tgrSteps = [-0.01, -0.005, 0, 0.005, 0.01];
  
  const grid: number[][] = [];

  for (const wStep of waccSteps) {
    const row: number[] = [];
    for (const tStep of tgrSteps) {
      const testWacc = baseWacc + wStep;
      const testTgr = baseTgr + tStep;
      
      const testInputs = { 
        ...inputs, 
        userWacc: testWacc * 100, 
        userTgr: testTgr * 100 
      };
      
      try {
        const v = compute(testInputs);
        row.push(v.perShare);
      } catch (e) {
        row.push(0);
      }
    }
    grid.push(row);
  }

  return grid;
}
