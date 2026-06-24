import macroConfig from './macro_config.json';

export type RouteType = 'A_MATURE_DCF' | 'B_STARTUP_REV' | 'C_BANK_DDM' | 'D_CYCLICAL_NORM';

export interface ValuationInputs {
  ticker: string;
  price: number;
  marketCap: number;
  totalDebt: number;
  totalCash: number;
  sharesOutstanding: number;
  fcf: number;
  revenue: number;
  revenueGrowth: number;
  ebitda: number;
  netIncome: number;
  beta: number;
  sector: string;
  industry: string;
  country: string;
  dividendYield?: number;
  
  // User Overrides
  userGrowthRate?: number;
  userTgr?: number;
  userWacc?: number;
}

export interface ValuationOutput {
  intrinsicSharePrice: number;
  routeType: RouteType;
  methodName: string;
  wacc: number;
  tgr: number;
  growthRate: number;
  fcfProjections: { year: number; fcf: number; pv: number }[];
  pvTerminalValue: number;
  marginOfSafety: number;
  flaggedForReview: boolean;
}

export class ValuationRouter {
  
  static getMacroConfig(country: string) {
    if (country === 'India' || country === 'IN') return macroConfig.geographies.IN;
    if (country === 'United States' || country === 'US') return macroConfig.geographies.US;
    return macroConfig.geographies.DEFAULT;
  }

  static determineRoute(inputs: ValuationInputs): RouteType {
    const s = inputs.sector?.toLowerCase() || '';
    const i = inputs.industry?.toLowerCase() || '';
    
    if (s.includes('financial') || i.includes('bank') || i.includes('insurance')) {
      return 'C_BANK_DDM';
    }
    
    if (s.includes('energy') || s.includes('basic materials') || i.includes('oil') || i.includes('mining')) {
      return 'D_CYCLICAL_NORM';
    }
    
    // If high growth but negative FCF -> Startup Route
    if (inputs.fcf <= 0 && inputs.revenueGrowth > 0.15) {
      return 'B_STARTUP_REV';
    }
    
    return 'A_MATURE_DCF';
  }

  static calculateWacc(inputs: ValuationInputs, macro: any): number {
    const costOfDebt = 5.5;
    const taxRate = 0.21;
    const costOfEquity = macro.riskFreeRate + inputs.beta * macro.equityRiskPremium;
    
    const equityValue = inputs.marketCap > 0 ? inputs.marketCap : 0;
    const debtValue = inputs.totalDebt > 0 ? inputs.totalDebt : 0;
    const totalCapital = equityValue + debtValue;
    
    const equityWeight = totalCapital > 0 ? equityValue / totalCapital : 1;
    const debtWeight = totalCapital > 0 ? debtValue / totalCapital : 0;
    
    let rawWacc = (equityWeight * costOfEquity) + (debtWeight * costOfDebt * (1 - taxRate));
    
    // Bounds check based on macro config
    rawWacc = Math.max(rawWacc, macro.minWacc);
    
    // Mega-cap normalizer
    if (inputs.marketCap > 100e9) {
      rawWacc = Math.min(rawWacc, 10.5);
    }
    
    return inputs.userWacc || rawWacc;
  }

  static routeAndCalculate(inputs: ValuationInputs): ValuationOutput {
    const macro = this.getMacroConfig(inputs.country);
    const route = this.determineRoute(inputs);
    
    let wacc = this.calculateWacc(inputs, macro);
    const tgr = inputs.userTgr !== undefined ? Math.min(inputs.userTgr, macro.maxTerminalGrowthRate) : macro.maxTerminalGrowthRate;
    let growthRate = inputs.userGrowthRate || (inputs.revenueGrowth * 100) || 8;
    growthRate = Math.min(Math.max(growthRate, 2), 40); // bounds
    
    let fcfBase = inputs.fcf > 0 ? inputs.fcf : (inputs.marketCap * 0.04);
    let fcfProjections: { year: number; fcf: number; pv: number }[] = [];
    let pvSum = 0;
    let terminalValue = 0;
    let methodName = '';
    
    if (route === 'C_BANK_DDM') {
      // DDM Model bypasses WACC for Ke, uses Net Income as proxy for distributable cash
      wacc = macro.riskFreeRate + inputs.beta * macro.equityRiskPremium; 
      fcfBase = inputs.netIncome > 0 ? inputs.netIncome : (inputs.marketCap * 0.06);
      methodName = "Dividend Discount Model (Cost of Equity)";
    } 
    else if (route === 'B_STARTUP_REV') {
      // Revenue-to-FCF Mapping (Target 20% margin in Year 5)
      fcfBase = inputs.revenue * 0.02; // Start with tiny positive baseline for math to work
      methodName = "Revenue-to-FCF Margin Expansion";
    }
    else if (route === 'D_CYCLICAL_NORM') {
      // Normalized FCF (using EBITDA proxy to smooth cycles)
      fcfBase = inputs.ebitda > 0 ? inputs.ebitda * 0.6 : fcfBase;
      methodName = "Cyclical Normalized FCF Model";
    }
    else {
      methodName = "Multi-Stage Linear Fade DCF";
    }

    // Mathematical Loop: Stage 1 (Years 1-5)
    for (let i = 1; i <= 5; i++) {
      let futureFcf = fcfBase * Math.pow(1 + growthRate / 100, i);
      if (route === 'B_STARTUP_REV') {
        // Linearly expand margin from 2% to 20%
        const margin = 0.02 + (0.18 / 5) * i;
        futureFcf = (inputs.revenue * Math.pow(1 + growthRate / 100, i)) * margin;
      }
      const pv = futureFcf / Math.pow(1 + wacc / 100, i);
      pvSum += pv;
      fcfProjections.push({ year: i, fcf: futureFcf, pv });
    }

    // Mathematical Loop: Stage 2 (Years 6-10 Linear Fade)
    const fadeRate = (growthRate - tgr) / 5;
    let prevFcf = fcfProjections[4].fcf;
    
    for (let i = 6; i <= 10; i++) {
      const fadedGrowth = Math.max(growthRate - fadeRate * (i - 5), tgr);
      const futureFcf = prevFcf * (1 + fadedGrowth / 100);
      const pv = futureFcf / Math.pow(1 + wacc / 100, i);
      pvSum += pv;
      fcfProjections.push({ year: i, fcf: futureFcf, pv });
      prevFcf = futureFcf;
    }

    // Terminal Value
    const lastFcf = fcfProjections[9].fcf;
    terminalValue = (lastFcf * (1 + tgr / 100)) / (wacc / 100 - tgr / 100);
    const pvTerminalValue = terminalValue / Math.pow(1 + wacc / 100, 10);

    const netCash = route === 'C_BANK_DDM' ? 0 : (inputs.totalCash - inputs.totalDebt);
    const equityVal = pvSum + pvTerminalValue + netCash;
    const intrinsicSharePrice = inputs.sharesOutstanding > 0 ? equityVal / inputs.sharesOutstanding : 0;
    
    const marginOfSafety = inputs.price > 0 && intrinsicSharePrice > 0
      ? ((intrinsicSharePrice - inputs.price) / inputs.price) * 100 : 0;

    // Phase 3: Fallback & Error Handling
    const flaggedForReview = Math.abs(marginOfSafety) > 60;

    return {
      intrinsicSharePrice: Math.max(intrinsicSharePrice, 0),
      routeType: route,
      methodName,
      wacc,
      tgr,
      growthRate,
      fcfProjections,
      pvTerminalValue,
      marginOfSafety,
      flaggedForReview
    };
  }
}
