import { computeValuation } from "./src/lib/valuation/core";

const inputs = {
  ticker: "AAPL",
  price: 275.15,
  marketCap: 4041225797632,
  totalDebt: 84710998016,
  totalCash: 68507000832,
  sharesOutstanding: 14687356000,
  fcf: 101090746368,
  revenue: 451442016256,
  revenueGrowth: 0.166,
  ebitda: 159975997440,
  netIncome: 100000000,
  beta: 1.086,
  sector: "Technology",
  industry: "Consumer Electronics",
  country: "United States",
  dividendYield: 0.0035,
  payoutRatio: 0.1259
};

try {
   const res = computeValuation(inputs);
   console.log("Sensitivity rows: ", res.sensitivity?.length);
   if (res.sensitivity?.length > 0) {
      console.log("Cols in row 0: ", res.sensitivity[0]?.length);
   }
} catch (e) {
   console.error("Crash: ", e);
}
