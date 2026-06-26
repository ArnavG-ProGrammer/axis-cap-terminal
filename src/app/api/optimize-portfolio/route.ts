import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

import { cachedYahooFetch } from '@/lib/yahoo/cache';
import { CACHE_CONFIG } from '@/lib/yahoo/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { assets } = await req.json();
    if (!assets || !Array.isArray(assets) || assets.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 assets' }, { status: 400 });
    }

    const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const results = [];
    let totalBeta = 0;

    for (const asset of assets) {
      try {
        const summary = await cachedYahooFetch(`summary:${asset.symbol}`, () => yahooFinance.quoteSummary(asset.symbol, { modules: ['defaultKeyStatistics'] }), CACHE_CONFIG.TTL_PROFILE);
        const beta = summary?.defaultKeyStatistics?.beta || 1.0;
        
        // We use an Inverse-Beta approach (Risk Parity proxy) for the optimization
        // Lower beta = higher allocation to minimize volatility
        const riskWeight = 1 / Math.max(beta, 0.1); 
        totalBeta += riskWeight;
        
        results.push({
           symbol: asset.symbol,
           beta: beta,
           riskWeight: riskWeight
        });
      } catch (e) {
        // Fallback for missing data
        results.push({ symbol: asset.symbol, beta: 1.0, riskWeight: 1.0 });
        totalBeta += 1.0;
      }
    }

    // Normalize weights to 100%
    const optimizedAllocations = results.map(r => ({
       symbol: r.symbol,
       targetWeight: r.riskWeight / totalBeta,
       beta: r.beta
    }));

    // Calculate a mock Sharpe Ratio based on the aggregate beta (lower aggregate beta = higher Sharpe in this proxy model)
    const portfolioBeta = optimizedAllocations.reduce((acc, curr) => acc + (curr.beta * curr.targetWeight), 0);
    // Assuming 8% market return, 4% risk-free rate
    const expectedReturn = 0.04 + portfolioBeta * (0.08 - 0.04);
    // Rough proxy for portfolio standard deviation based on beta
    const proxyVolatility = portfolioBeta * 0.15; 
    const sharpeRatio = proxyVolatility > 0 ? ((expectedReturn - 0.04) / proxyVolatility) : 0;

    return NextResponse.json({
       allocations: optimizedAllocations,
       portfolioBeta: portfolioBeta,
       sharpeRatio: sharpeRatio,
       expectedReturn: expectedReturn
    });

  } catch (error: any) {
    console.error("Optimization Error:", error);
    return NextResponse.json({ error: 'Internal Route Error' }, { status: 500 });
  }
}
