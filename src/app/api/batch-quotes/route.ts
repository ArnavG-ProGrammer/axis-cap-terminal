import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('symbols');

    if (!q) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const symbols = q.split(',').map(s => s.trim()).filter(Boolean);
    if (symbols.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    // Fetch batch quotes safely using Promise.allSettled to prevent one bad ticker from crashing the batch
    const results = await Promise.allSettled(
      symbols.map(sym => yahooFinance.quote(sym))
    );

    const validQuotes = results
      .filter((res): res is PromiseFulfilledResult<any> => res.status === 'fulfilled' && !!res.value)
      .map(res => res.value);
    
    // Format to match the expected asset schema
    const formatted = validQuotes.map(q => ({
      symbol: q.symbol,
      name: q.longName || q.shortName || q.symbol,
      type: q.quoteType === 'CRYPTOCURRENCY' ? 'CRYPTO' : q.quoteType === 'CURRENCY' ? 'FOREX' : (q.quoteType === 'FUTURE' || q.quoteType === 'COMMODITY' ? 'COMMODITY' : 'EQUITY'),
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChangePercent || 0,
      region: (q.exchange === 'NSI' || q.exchange === 'NSE' || q.exchange === 'BSE' || q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')) ? 'INDIA' : (q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'CURRENCY' || q.quoteType === 'FUTURE' || q.quoteType === 'COMMODITY' ? 'GLOBAL' : 'US')
    }));

    return NextResponse.json({ quotes: formatted });
  } catch (error: any) {
    console.error('Batch Quote API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
