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
    
    // Fetch quotes in parallel
    const quotes = await Promise.all(
      symbols.map(symbol => 
        yahooFinance.quote(symbol).catch(() => null)
      )
    );

    const validQuotes = quotes.filter(q => q !== null);

    // Format for the heatmap
    const data = validQuotes.map(q => ({
      name: q.shortName || q.symbol,
      symbol: q.symbol,
      value: q.marketCap || 0, // Used for block size
      change: q.regularMarketChangePercent || 0, // Used for color
      price: q.regularMarketPrice,
      currency: q.currency,
      sector: q.sector || 'Other',
      volume: q.regularMarketVolume,
      avgVolume: q.averageDailyVolume3Month
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Heatmap API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 });
  }
}
