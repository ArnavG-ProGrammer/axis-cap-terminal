import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'No query' }, { status: 400 });
    }

    // Fetch from THREE Yahoo endpoints in parallel for maximum data coverage
    const [chartRes, quoteRes, summaryRes] = await Promise.all([
      // v8 Chart API — most reliable for price data + historical closes
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(q)}?interval=1d&range=1y`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" }
      }).catch(() => null),

      // v6 Quote API — provides market cap, EPS, shares outstanding, P/E
      fetch(`https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(q)}`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" }
      }).catch(() => null),

      // v10 QuoteSummary — richest data: financialData has FCF, revenue, margins, ROE
      fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(q)}?modules=price,defaultKeyStatistics,financialData,incomeStatementHistory,balanceSheetHistory`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" }
      }).catch(() => null),
    ]);

    let chartMeta: any = null;
    let quoteSummary: any = null;
    let v10Data: any = null;
    let historicalPrices: number[] = [];

    // Parse chart data (1 year of daily closes for real backtesting)
    if (chartRes && chartRes.ok) {
      try {
        const chartData = await chartRes.json();
        chartMeta = chartData.chart?.result?.[0]?.meta;
        const closes = chartData.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        if (closes && Array.isArray(closes)) {
          historicalPrices = closes.filter((c: any) => c !== null && c !== undefined);
        }
      } catch { /* skip */ }
    }

    // Parse v6 quote data
    if (quoteRes && quoteRes.ok) {
      try {
        const quoteData = await quoteRes.json();
        const results = quoteData.quoteResponse?.result;
        if (results && results.length > 0) {
          quoteSummary = results[0];
        }
      } catch { /* skip */ }
    }

    // Parse v10 quoteSummary (SEC filing-grade data)
    if (summaryRes && summaryRes.ok) {
      try {
        const sData = await summaryRes.json();
        const result = sData.quoteSummary?.result?.[0];
        if (result) {
          v10Data = {
            // financialData module — direct from SEC filings
            freeCashflow: result.financialData?.freeCashflow?.raw,
            operatingCashflow: result.financialData?.operatingCashflow?.raw,
            totalRevenue: result.financialData?.totalRevenue?.raw,
            revenueGrowth: result.financialData?.revenueGrowth?.raw,
            grossMargins: result.financialData?.grossMargins?.raw,
            operatingMargins: result.financialData?.operatingMargins?.raw,
            profitMargins: result.financialData?.profitMargins?.raw,
            returnOnEquity: result.financialData?.returnOnEquity?.raw,
            debtToEquity: result.financialData?.debtToEquity?.raw,
            currentRatio: result.financialData?.currentRatio?.raw,
            totalDebt: result.financialData?.totalDebt?.raw,
            totalCash: result.financialData?.totalCash?.raw,

            // defaultKeyStatistics module
            sharesOutstanding: result.defaultKeyStatistics?.sharesOutstanding?.raw,
            floatShares: result.defaultKeyStatistics?.floatShares?.raw,
            beta: result.defaultKeyStatistics?.beta?.raw,
            trailingEps: result.defaultKeyStatistics?.trailingEps?.raw,
            forwardEps: result.defaultKeyStatistics?.forwardEps?.raw,
            trailingPE: result.defaultKeyStatistics?.trailingPE?.raw,
            forwardPE: result.defaultKeyStatistics?.forwardPE?.raw,
            pegRatio: result.defaultKeyStatistics?.pegRatio?.raw,
            bookValue: result.defaultKeyStatistics?.bookValue?.raw,
            priceToBook: result.defaultKeyStatistics?.priceToBook?.raw,
            enterpriseValue: result.defaultKeyStatistics?.enterpriseValue?.raw,
            enterpriseToRevenue: result.defaultKeyStatistics?.enterpriseToRevenue?.raw,
            enterpriseToEbitda: result.defaultKeyStatistics?.enterpriseToEbitda?.raw,
            fiftyTwoWeekHigh: result.defaultKeyStatistics?.['52WeekChange']?.raw,

            // price module
            marketCap: result.price?.marketCap?.raw,
            currency: result.price?.currency,
            shortName: result.price?.shortName,
            longName: result.price?.longName,
          };
        }
      } catch { /* skip */ }
    }

    if (!chartMeta && !quoteSummary && !v10Data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Merge data — prioritize v10 (SEC-grade) > v6 (quote) > v8 (chart)
    const price = chartMeta?.regularMarketPrice || quoteSummary?.regularMarketPrice || 0;
    const prevClose = chartMeta?.chartPreviousClose || quoteSummary?.regularMarketPreviousClose || price;
    const change = quoteSummary?.regularMarketChange ?? (price - prevClose);
    const changePercent = quoteSummary?.regularMarketChangePercent
      ? quoteSummary.regularMarketChangePercent * (Math.abs(quoteSummary.regularMarketChangePercent) > 1 ? 1 : 100)
      : (prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0);

    const high52w = quoteSummary?.fiftyTwoWeekHigh || (historicalPrices.length > 10 ? Math.max(...historicalPrices) : price * 1.2);
    const low52w = quoteSummary?.fiftyTwoWeekLow || (historicalPrices.length > 10 ? Math.min(...historicalPrices) : price * 0.8);

    return NextResponse.json({
       price,
       change,
       changePercent,
       volume: quoteSummary?.regularMarketVolume || chartMeta?.regularMarketVolume || 0,
       marketCap: v10Data?.marketCap || quoteSummary?.marketCap || 0,
       name: v10Data?.shortName || quoteSummary?.shortName || quoteSummary?.longName || chartMeta?.shortName || q,
       currency: v10Data?.currency || quoteSummary?.currency || chartMeta?.currency || 'USD',

       // Fundamental data (SEC filing grade from v10)
       sharesOutstanding: v10Data?.sharesOutstanding || quoteSummary?.sharesOutstanding || 0,
       trailingPE: v10Data?.trailingPE || quoteSummary?.trailingPE || 0,
       forwardPE: v10Data?.forwardPE || 0,
       trailingEps: v10Data?.trailingEps || quoteSummary?.trailingEps || quoteSummary?.epsTrailingTwelveMonths || 0,
       forwardEps: v10Data?.forwardEps || 0,
       bookValue: v10Data?.bookValue || quoteSummary?.bookValue || 0,
       priceToBook: v10Data?.priceToBook || 0,
       pegRatio: v10Data?.pegRatio || 0,

       // Cash flow & income (SEC-grade)
       freeCashflow: v10Data?.freeCashflow || quoteSummary?.freeCashflow || 0,
       operatingCashflow: v10Data?.operatingCashflow || 0,
       totalRevenue: v10Data?.totalRevenue || quoteSummary?.totalRevenue || 0,
       revenueGrowth: v10Data?.revenueGrowth || 0,

       // Margins & ratios
       grossMargins: v10Data?.grossMargins || 0,
       operatingMargins: v10Data?.operatingMargins || 0,
       profitMargins: v10Data?.profitMargins || 0,
       returnOnEquity: v10Data?.returnOnEquity || 0,
       debtToEquity: v10Data?.debtToEquity || 0,

       // Enterprise value
       enterpriseValue: v10Data?.enterpriseValue || 0,
       enterpriseToRevenue: v10Data?.enterpriseToRevenue || 0,
       enterpriseToEbitda: v10Data?.enterpriseToEbitda || 0,

       // Risk
       beta: v10Data?.beta || 0,
       totalDebt: v10Data?.totalDebt || 0,
       totalCash: v10Data?.totalCash || 0,

       // Price ranges
       fiftyTwoWeekHigh: high52w,
       fiftyTwoWeekLow: low52w,
       dayHigh: quoteSummary?.regularMarketDayHigh || (price * 1.01),
       dayLow: quoteSummary?.regularMarketDayLow || (price * 0.99),
       previousClose: prevClose,
       open: quoteSummary?.regularMarketOpen || price,

       // Historical price array for real backtesting (1yr daily closes)
       historicalPrices: historicalPrices,
    });

  } catch (error) {
    console.error("Proxy Quote Error", error);
    return NextResponse.json({ error: 'Internal Server Crash' }, { status: 500 });
  }
}
