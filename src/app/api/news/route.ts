import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('q');

    if (!symbol) {
      return NextResponse.json({ error: 'No ticker provided' }, { status: 400 });
    }

    // Using search to get news associated with the ticker
    const result = await yahooFinance.search(symbol, { newsCount: 10 });
    
    if (!result.news || result.news.length === 0) {
      // Fallback to global market news if specific ticker news is missing
      const marketResult = await yahooFinance.search('MARKET', { newsCount: 10 });
      return NextResponse.json(marketResult.news || []);
    }

    return NextResponse.json(result.news);

  } catch (error: any) {
    console.error("News API Error:", error);
    return NextResponse.json({ error: 'News temporarily unavailable' }, { status: 500 });
  }
}
