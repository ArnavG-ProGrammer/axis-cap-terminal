import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',');
    
    // Make a single call to avoid concurrent rate-limiting from Yahoo Finance
    let validQuotes: any[] = [];
    try {
      const result = await yahooFinance.quote(symbols);
      validQuotes = Array.isArray(result) ? result : [result];
    } catch (err) {
      console.error("Yahoo Finance Quote Error:", err);
      return NextResponse.json({ data: [], error: 'Upstream data provider failed' });
    }

    if (validQuotes.length === 0) {
      return NextResponse.json({ data: [], error: 'No quotes returned' });
    }

    // Format for the heatmap
    const data = validQuotes.map(q => ({
      name: q.shortName || q.symbol,
      symbol: q.symbol,
      value: q.marketCap || 1000000000, // Fallback weight if marketCap is missing
      change: q.regularMarketChangePercent || 0,
      price: q.regularMarketPrice || 0,
      currency: q.currency,
      sector: q.sector || 'Financials',
      volume: q.regularMarketVolume || 0,
      avgVolume: q.averageDailyVolume3Month || 0
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Heatmap API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 });
  }
}
