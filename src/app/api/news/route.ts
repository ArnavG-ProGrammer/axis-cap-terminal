import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ news: [] });
    }

    // Use yahoo-finance2 search to get news for a specific ticker
    const result = await yahooFinance.search(q, { newsCount: 15, quotesCount: 0 });

    const news = (result.news || []).map((article: any) => ({
      title: article.title || '',
      publisher: article.publisher || 'Unknown',
      link: article.link || '',
      publishedAt: article.providerPublishTime
        ? new Date(article.providerPublishTime).toISOString()
        : new Date().toISOString(),
      thumbnail: article.thumbnail?.resolutions?.[0]?.url || null,
      relatedTickers: article.relatedTickers || [],
      type: article.type || 'STORY',
    }));

    return NextResponse.json({ news });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ news: [] });
  }
}
