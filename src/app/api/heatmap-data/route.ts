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
    
    // Chunk symbols into groups of 10 to prevent large-batch failures
    const chunks = [];
    for (let i = 0; i < symbols.length; i += 10) {
      chunks.push(symbols.slice(i, i + 10));
    }

    const allQuotes = await Promise.allSettled(
      chunks.map(chunk => yahooFinance.quote(chunk))
    );

    let validQuotes: any[] = [];
    allQuotes.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        // Handle both array and object returns from yahoo-finance2
        const values = Array.isArray(result.value) ? result.value : [result.value];
        validQuotes = [...validQuotes, ...values.filter(q => q !== null)];
      }
    });

    if (validQuotes.length === 0) {
      return NextResponse.json({ data: [], error: 'All data chunks failed' });
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
