import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'No query' }, { status: 400 });
    }

    try {
      // 1. Fetch live quote
      const quote = await yahooFinance.quote(q);
      
      // 2. Fetch full SEC fundamentals & detailed pricing using quoteSummary
      const summary = await yahooFinance.quoteSummary(q, {
        modules: ['price', 'defaultKeyStatistics', 'financialData']
      }).catch(() => null);

      // 3. Fetch 1 year of daily historical prices for backtesting engine
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const history = await yahooFinance.historical(q, {
        period1: oneYearAgo,
        period2: new Date(),
        interval: '1d'
      }).catch((e) => {
        console.error("History fetch error: ", e);
        return [];
      });
      
      const historicalPrices = history.map(h => h.close).filter(c => c > 0);

      if (!quote) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      // Merge data intelligently
      const price = quote.regularMarketPrice || summary?.price?.regularMarketPrice || 0;
      const prevClose = quote.regularMarketPreviousClose || summary?.price?.regularMarketPreviousClose || price;
      const change = quote.regularMarketChange || (price - prevClose);
      const changePercent = quote.regularMarketChangePercent 
        ? quote.regularMarketChangePercent 
        : (prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0);

      const high52w = quote.fiftyTwoWeekHigh || price * 1.2;
      const low52w = quote.fiftyTwoWeekLow || price * 0.8;

      return NextResponse.json({
         price,
         change,
         changePercent,
         volume: quote.regularMarketVolume || summary?.price?.regularMarketVolume || 0,
         marketCap: quote.marketCap || summary?.price?.marketCap || 0,
         name: quote.shortName || quote.longName || q,
         currency: quote.currency || 'USD',
         exchange: quote.exchange || summary?.price?.exchangeName || 'NMS',
         quoteType: quote.quoteType || 'EQUITY',
  
         // Fundamental data (SEC filing grade)
         sharesOutstanding: quote.sharesOutstanding || summary?.defaultKeyStatistics?.sharesOutstanding || 0,
         trailingPE: quote.trailingPE || summary?.defaultKeyStatistics?.trailingPE || 0,
         forwardPE: quote.forwardPE || summary?.defaultKeyStatistics?.forwardPE || 0,
         trailingEps: quote.epsTrailingTwelveMonths || summary?.defaultKeyStatistics?.trailingEps || 0,
         forwardEps: quote.epsForward || summary?.defaultKeyStatistics?.forwardEps || 0,
         bookValue: quote.bookValue || summary?.defaultKeyStatistics?.bookValue || 0,
         priceToBook: quote.priceToBook || summary?.defaultKeyStatistics?.priceToBook || 0,
         pegRatio: summary?.defaultKeyStatistics?.pegRatio || 0,
  
         // Crypto / FX specialized metrics
         circulatingSupply: quote.circulatingSupply || summary?.defaultKeyStatistics?.circulatingSupply || 0,
         maxSupply: quote.maxSupply || summary?.defaultKeyStatistics?.maxSupply || 0,
         bid: quote.bid || 0,
         ask: quote.ask || 0,

         // Cash flow & income (SEC-grade)
         freeCashflow: summary?.financialData?.freeCashflow || 0,
         operatingCashflow: summary?.financialData?.operatingCashflow || 0,
         revenue: summary?.financialData?.totalRevenue || 0,
         revenueGrowth: summary?.financialData?.revenueGrowth || 0,
         grossMargins: summary?.financialData?.grossMargins || 0,
         operatingMargins: summary?.financialData?.operatingMargins || 0,
         profitMargins: summary?.financialData?.profitMargins || 0,
         returnOnEquity: summary?.financialData?.returnOnEquity || 0,
         ebitda: summary?.financialData?.ebitda || 0,
  
         // Risk bounds
         beta: summary?.defaultKeyStatistics?.beta || 0,
         debtToEquity: summary?.financialData?.debtToEquity || 0,
  
         // Historical Context bounds
         fiftyTwoWeekHigh: high52w,
         fiftyTwoWeekLow: low52w,
         fiftyDayAverage: quote.fiftyDayAverage || price,
         twoHundredDayAverage: quote.twoHundredDayAverage || price,
         historicalPrices
      });

    } catch (apiError: any) {
      console.error("Yahoo API Query Error:", apiError);
      return NextResponse.json({ error: 'Asset metrics temporarily unavailable' }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Quote Route Fatal Error:", error);
    return NextResponse.json({ error: 'Internal Route Execution Error' }, { status: 500 });
  }
}
