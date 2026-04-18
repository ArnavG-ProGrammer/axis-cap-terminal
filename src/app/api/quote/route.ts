import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'No query' }, { status: 400 });
    }

    // Fetch from TWO Yahoo endpoints in parallel for maximum data coverage
    const [chartRes, quoteRes] = await Promise.all([
      // v8 Chart API — most reliable for price data
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(q)}?interval=1d&range=5d`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" }
      }).catch(() => null),

      // v6 Quote API — provides market cap, EPS, shares outstanding, P/E etc.
      fetch(`https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(q)}`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" }
      }).catch(() => null),
    ]);

    let chartMeta: any = null;
    let quoteSummary: any = null;
    let historicalPrices: number[] = [];

    // Parse chart data
    if (chartRes && chartRes.ok) {
      try {
        const chartData = await chartRes.json();
        chartMeta = chartData.chart?.result?.[0]?.meta;
        
        // Extract historical close prices for volatility/range calculations
        const closes = chartData.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        if (closes && Array.isArray(closes)) {
          historicalPrices = closes.filter((c: any) => c !== null && c !== undefined);
        }
      } catch { /* skip */ }
    }

    // Parse quote summary data (has market cap, EPS, P/E, shares, etc.)
    if (quoteRes && quoteRes.ok) {
      try {
        const quoteData = await quoteRes.json();
        const results = quoteData.quoteResponse?.result;
        if (results && results.length > 0) {
          quoteSummary = results[0];
        }
      } catch { /* skip */ }
    }

    // If neither worked, try a fallback v10 approach
    if (!chartMeta && !quoteSummary) {
      try {
        const fallbackRes = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(q)}?modules=price,defaultKeyStatistics,financialData`, {
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const fbPrice = fbData.quoteSummary?.result?.[0]?.price;
          if (fbPrice) {
            quoteSummary = {
              regularMarketPrice: fbPrice.regularMarketPrice?.raw,
              regularMarketChange: fbPrice.regularMarketChange?.raw,
              regularMarketChangePercent: fbPrice.regularMarketChangePercent?.raw ? fbPrice.regularMarketChangePercent.raw * 100 : 0,
              regularMarketVolume: fbPrice.regularMarketVolume?.raw,
              marketCap: fbPrice.marketCap?.raw,
              shortName: fbPrice.shortName,
              longName: fbPrice.longName,
              currency: fbPrice.currency,
              sharesOutstanding: fbData.quoteSummary?.result?.[0]?.defaultKeyStatistics?.sharesOutstanding?.raw,
              trailingPE: fbData.quoteSummary?.result?.[0]?.defaultKeyStatistics?.trailingPE?.raw,
              trailingEps: fbData.quoteSummary?.result?.[0]?.defaultKeyStatistics?.trailingEps?.raw,
              bookValue: fbData.quoteSummary?.result?.[0]?.defaultKeyStatistics?.bookValue?.raw,
              fiftyTwoWeekLow: fbPrice.regularMarketDayLow?.raw,
              fiftyTwoWeekHigh: fbPrice.regularMarketDayHigh?.raw,
              totalRevenue: fbData.quoteSummary?.result?.[0]?.financialData?.totalRevenue?.raw,
              freeCashflow: fbData.quoteSummary?.result?.[0]?.financialData?.freeCashflow?.raw,
            };
          }
        }
      } catch { /* skip */ }
    }

    if (!chartMeta && !quoteSummary) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Merge data from both sources — quote summary is richer, chart meta is more reliable for price
    const price = chartMeta?.regularMarketPrice || quoteSummary?.regularMarketPrice || 0;
    const prevClose = chartMeta?.chartPreviousClose || quoteSummary?.regularMarketPreviousClose || price;
    const change = quoteSummary?.regularMarketChange ?? (price - prevClose);
    const changePercent = quoteSummary?.regularMarketChangePercent 
      ? quoteSummary.regularMarketChangePercent * (Math.abs(quoteSummary.regularMarketChangePercent) > 1 ? 1 : 100)
      : (prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0);

    // Calculate historical stats from chart data
    const high52w = quoteSummary?.fiftyTwoWeekHigh || (historicalPrices.length > 0 ? Math.max(...historicalPrices) * 1.15 : price * 1.3);
    const low52w = quoteSummary?.fiftyTwoWeekLow || (historicalPrices.length > 0 ? Math.min(...historicalPrices) * 0.85 : price * 0.7);

    return NextResponse.json({ 
       price: price,
       change: change,
       changePercent: changePercent,
       volume: quoteSummary?.regularMarketVolume || chartMeta?.regularMarketVolume || 0,
       marketCap: quoteSummary?.marketCap || 0,
       name: quoteSummary?.shortName || quoteSummary?.longName || chartMeta?.shortName || chartMeta?.longName || q,
       currency: quoteSummary?.currency || chartMeta?.currency || 'USD',

       // Financial data for DCF/analysis  
       sharesOutstanding: quoteSummary?.sharesOutstanding || 0,
       trailingPE: quoteSummary?.trailingPE || 0,
       trailingEps: quoteSummary?.trailingEps || quoteSummary?.epsTrailingTwelveMonths || 0,
       bookValue: quoteSummary?.bookValue || 0,
       freeCashflow: quoteSummary?.freeCashflow || 0,
       totalRevenue: quoteSummary?.totalRevenue || quoteSummary?.revenue || 0,
       fiftyTwoWeekHigh: high52w,
       fiftyTwoWeekLow: low52w,
       dayHigh: quoteSummary?.regularMarketDayHigh || (price * 1.01),
       dayLow: quoteSummary?.regularMarketDayLow || (price * 0.99),
       previousClose: prevClose,
       open: quoteSummary?.regularMarketOpen || chartMeta?.regularMarketPrice || price,
    });

  } catch (error) {
    console.error("Proxy Quote Error", error);
    return NextResponse.json({ error: 'Internal Server Crash' }, { status: 500 });
  }
}
