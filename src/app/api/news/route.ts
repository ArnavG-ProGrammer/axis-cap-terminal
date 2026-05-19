import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'image']
  }
});

// A robust set of global financial feeds to ensure high density
// Utilizing highly reliable Yahoo Finance sector endpoints to prevent Vercel timeouts
const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,MSFT,NVDA,GOOGL,AMZN,META',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=JPM,BAC,WFC,GS,MS,C',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=XOM,CVX,SHEL,TTE,BP',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD,ETH-USD,SOL-USD',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F,CL=F,SI=F',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=TSLA,F,GM,TM,HMC',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=LLY,JNJ,UNH,MRK,ABBV',
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
  'https://www.investing.com/rss/news_25.rss',
  'https://www.investing.com/rss/news_287.rss'
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    let allNews: any[] = [];

    // 1. Fetch via Yahoo Finance for the specific ticker
    if (q) {
      try {
        const result = await yahooFinance.search(q, { newsCount: 30, quotesCount: 0 });
        const yNews = (result.news || []).map((article: any) => ({
          title: article.title || '',
          publisher: article.publisher || 'Yahoo Finance',
          link: article.link || '',
          publishedAt: article.providerPublishTime
            ? new Date(article.providerPublishTime).toISOString()
            : new Date().toISOString(),
          thumbnail: article.thumbnail?.resolutions?.[0]?.url || null,
          relatedTickers: article.relatedTickers || [q],
          type: article.type || 'STORY',
          description: article.summary || article.preview || ''
        }));
        allNews = [...allNews, ...yNews];
      } catch (e) {
        console.error("Yahoo Finance news error:", e);
      }
    }

    // 2. Aggregate from global institutional RSS feeds
    try {
      const feedPromises = RSS_FEEDS.map(async (feedUrl) => {
        try {
          const feed = await parser.parseURL(feedUrl);
          return feed.items.map(item => ({
            title: item.title || '',
            publisher: feed.title || 'Market News',
            link: item.link || '',
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            thumbnail: (item as any)['media:content']?.$?.url || (item as any)['media:thumbnail']?.$?.url || null,
            relatedTickers: [],
            type: 'STORY',
            description: item.contentSnippet || item.content || item.summary || ''
          }));
        } catch (e) {
          console.warn(`Failed to parse RSS feed ${feedUrl}`);
          return [];
        }
      });
      
      const rssResults = await Promise.all(feedPromises);
      for (const rss of rssResults) {
         allNews = [...allNews, ...rss];
      }
    } catch (e) {
      console.error("RSS aggregation error:", e);
    }

    // 3. Deduplicate and Sort
    const uniqueNews = Array.from(new Map(allNews.map(item => [item.title, item])).values());
    uniqueNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({ news: uniqueNews.slice(0, 1000) });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ news: [] });
  }
}
