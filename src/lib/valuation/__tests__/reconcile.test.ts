// src/lib/valuation/__tests__/reconcile.test.ts
// Ported to a basic script for environment simplicity.

import { computeValuation } from "../core";
import { ValuationInputs } from "../types";

function assertClose(actual: number, expected: number, tolerance = 0.05, msg: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`FAIL: ${msg} - expected ${expected}, got ${actual}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

async function runTests() {
  console.log("Running Reconciliations...");

  try {
    // TEST 1: TSLA Headline Bug
    console.log("Test 1: TSLA Headline Bug...");
    const tslaInputs: ValuationInputs = {
      ticker: "TSLA",
      country: "US",
      price: 150.26,
      sharesOutstanding: 3180,
      marketCap: 477826,
      fcf: 5252,
      revenue: 96773,
      revenueGrowth: 0.15,
      netIncome: 14997,
      totalDebt: 9556,
      totalCash: 29094,
      beta: 2.3,
      sector: "Consumer Cyclical",
      industry: "Auto Manufacturers",
      userGrowthRate: 16,
      userTgr: 2.5,
      userWacc: 14.1
    };

    const result1 = computeValuation(tslaInputs);
    
    // Headline Per Share must equal explicitly calculated EV bridge / shares
    const derivedEnterpriseValue = result1.schedule.reduce((acc, year) => acc + year.pv, 0) + result1.terminal.pv;
    const derivedEquityValue = derivedEnterpriseValue - tslaInputs.totalDebt! + tslaInputs.totalCash!;
    const derivedPerShare = derivedEquityValue / tslaInputs.sharesOutstanding;

    assertClose(result1.perShare, derivedPerShare, 0.05, "Headline perShare must match table math exactly");
    
    const g6 = result1.schedule[5].growth;
    const g10 = result1.schedule[9].growth;
    assert(g6 < 0.16, "Growth must fade from year 6");
    assertClose(g10, 0.025, 0.001, "Growth must not go negative, bounded by terminal");

    console.log("✓ TSLA Test Passed");

    // TEST 2: JPM Routing
    console.log("Test 2: JPM Routing to RIM...");
    const jpmInputs: ValuationInputs = {
      ticker: "JPM",
      country: "US",
      price: 195,
      sharesOutstanding: 2880,
      marketCap: 561600,
      fcf: 85000,
      revenue: 158000,
      netIncome: 49552,
      totalDebt: 0,
      totalCash: 0,
      beta: 1.1,
      sector: "Financial Services",
      industry: "Banks—Diversified"
    };

    const result2 = computeValuation(jpmInputs);
    assert(result2.method === "RIM", "JPM should route to RIM");
    assert(result2.inputs.fcf0 === 0, "RIM shouldn't blindly use CFO as FCF");
    
    console.log("✓ JPM Test Passed");

    // TEST 3: HDFC Routing
    console.log("Test 3: HDFC Indian Bank Routing...");
    const hdfcInputs: ValuationInputs = {
      ticker: "HDFC",
      country: "INDIA",
      price: 1450,
      sharesOutstanding: 7600,
      marketCap: 11020000,
      fcf: -50000,
      revenue: 250000,
      netIncome: 160000,
      beta: 1.2,
      sector: "Financial",
      industry: "Bank"
    };

    const result3 = computeValuation(hdfcInputs);
    assert(result3.method === "RIM", "HDFC should route to RIM");
    assert(result3.currency === "INR", "HDFC should be INR");
    assert(result3.inputs.ke > 0.12, "INR Ke should be higher than US (India CRP + Rf)");
    assert(result3.inputs.gTerm <= 0.055, "INR gTerm capped at 5.5%");

    console.log("✓ HDFC Test Passed");
    
    console.log("\nALL RECONCILIATIONS PASSED.");
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  }
}

runTests();
