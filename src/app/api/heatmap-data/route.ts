import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',');
    
    // Make batched calls to avoid concurrent rate-limiting from Yahoo Finance
    let validQuotes: any[] = [];
    const chunkSize = 20;
    
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      try {
        const result = await yahooFinance.quote(chunk);
        const arr = Array.isArray(result) ? result : [result];
        validQuotes = [...validQuotes, ...arr];
      } catch (err) {
        console.error(`Yahoo Finance Quote Error on chunk ${i}:`, err);
        // Continue to the next chunk even if one fails
      }
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
