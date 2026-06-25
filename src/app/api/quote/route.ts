import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || url.searchParams.get('symbol');

    if (!q) {
      return NextResponse.json({ error: 'No query or symbol provided' }, { status: 400 });
    }

    try {
      // 1. Fetch live quote
      const quote = await yahooFinance.quote(q);
      
      // 2. Fetch full SEC fundamentals & detailed pricing using quoteSummary
      const summary = await yahooFinance.quoteSummary(q, {
        modules: ['price', 'defaultKeyStatistics', 'financialData', 'insiderTransactions', 'netSharePurchaseActivity', 'assetProfile', 'summaryDetail']
      }).catch(() => null);

      // 3. Fetch 5 years of daily historical prices for extended charting
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const historyDaily = await yahooFinance.historical(q, {
        period1: fiveYearsAgo,
        period2: new Date(),
        interval: '1d'
      }).catch((e) => {
        console.error("Daily History fetch error: ", e);
        return [];
      });
      
      const historicalPrices = historyDaily.map(h => ({
         date: h.date?.toISOString() || new Date().toISOString(),
         open: h.open || h.close,
         high: h.high || h.close,
         low: h.low || h.close,
         price: h.close,
         volume: h.volume || 0
      })).filter(c => c.price > 0);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const chartData = await yahooFinance.chart(q, {
        period1: fiveDaysAgo,
        interval: '5m'
      }).catch((e) => {
        console.error("Intraday Chart fetch error: ", e);
        return null;
      });
      
      const historyIntraday = chartData?.quotes || [];
      const intradayPrices = historyIntraday.map((h: any) => ({
         date: h.date?.toISOString() || new Date().toISOString(),
         open: h.open || h.close,
         high: h.high || h.close,
         low: h.low || h.close,
         price: h.close,
         volume: h.volume || 0
      })).filter((c: any) => c.price > 0);

      // 5. Fetch 6-month medium term prices (60-minute interval) for 1M/6M granular views
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const mediumTermData = await yahooFinance.chart(q, {
        period1: sixMonthsAgo,
        interval: '60m'
      }).catch((e) => {
        console.error("Medium Term Chart fetch error: ", e);
        return null;
      });

      const historyMediumTerm = mediumTermData?.quotes || [];
      const mediumTermPrices = historyMediumTerm.map((h: any) => ({
         date: h.date?.toISOString() || new Date().toISOString(),
         open: h.open || h.close,
         high: h.high || h.close,
         low: h.low || h.close,
         price: h.close,
         volume: h.volume || 0
      })).filter((c: any) => c.price > 0);

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
         sector: summary?.assetProfile?.sector || 'Unknown',
         industry: summary?.assetProfile?.industry || 'Unknown',
         country: summary?.assetProfile?.country || 'Unknown',
  
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
         netIncome: summary?.financialData?.netIncomeToCommon || summary?.financialData?.netIncome || 0,
         dividendYield: quote.trailingAnnualDividendYield || summary?.summaryDetail?.dividendYield || 0,
         payoutRatio: summary?.summaryDetail?.payoutRatio || 0,
  
         // Risk bounds
         beta: summary?.defaultKeyStatistics?.beta || 0,
         debtToEquity: summary?.financialData?.debtToEquity || 0,
         totalDebt: summary?.financialData?.totalDebt || 0,
         totalCash: summary?.financialData?.totalCash || 0,
  
         fiftyTwoWeekHigh: high52w,
         fiftyTwoWeekLow: low52w,
         fiftyDayAverage: quote.fiftyDayAverage || price,
         twoHundredDayAverage: quote.twoHundredDayAverage || price,
         
         // Institutional Form 4 Data
         insiderTransactions: summary?.insiderTransactions?.transactions || [],
         netSharePurchaseActivity: summary?.netSharePurchaseActivity || null,
         
         historicalPrices,
         intradayPrices,
         mediumTermPrices
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
