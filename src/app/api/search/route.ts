import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ quotes: [] });
    }

    // Dual-Region Parallel Fetch: Ensures both US Mega-Caps (NASDAQ) and Indian listings (NSE/BSE) are definitively pulled before sorting.
    const [usRes, inRes] = await Promise.all([
       fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=40&newsCount=0&region=US&lang=en-US`, {
         method: "GET", headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
       }),
       fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=40&newsCount=0&region=IN&lang=en-IN`, {
         method: "GET", headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
       })
    ]);

    let rawQuotes: any[] = [];
    if (usRes.ok) {
       const usData = await usRes.json();
       if (usData.quotes) rawQuotes = [...rawQuotes, ...usData.quotes];
    }
    if (inRes.ok) {
       const inData = await inRes.json();
       if (inData.quotes) rawQuotes = [...rawQuotes, ...inData.quotes];
    }

    // Deduplicate by symbol
    const seen = new Set();
    let quotes: any[] = [];
    for (const item of rawQuotes) {
       if (item.symbol && !seen.has(item.symbol)) {
          seen.add(item.symbol);
          quotes.push(item);
       }
    }
    
    // Auto-inject NSE variants dynamically for BSE stocks to ensure NSE visibility
    const expandedQuotes: any[] = [];
    quotes.forEach((q: any) => {
      expandedQuotes.push(q);
      if (q.symbol && q.symbol.endsWith('.BO')) {
         const nseVariant = { 
            ...q, 
            symbol: q.symbol.replace('.BO', '.NS'), 
            exchDisp: 'NSE', 
            exchange: 'NSI' 
         };
         expandedQuotes.push(nseVariant);
      }
    });

    // Elite Algorithmic Sort: Push NSE/BSE & Equities to Absolute Top
    expandedQuotes.sort((a, b) => {
       const isAIndia = a.exchange === 'NSI' || a.exchange === 'BSE' || a.exchDisp === 'NSE' || a.exchDisp === 'Bombay';
       const isBIndia = b.exchange === 'NSI' || b.exchange === 'BSE' || b.exchDisp === 'NSE' || b.exchDisp === 'Bombay';
       
       const isAUS = a.exchange === 'NMS' || a.exchange === 'NYQ' || a.exchDisp === 'NASDAQ' || a.exchDisp === 'NYSE';
       const isBUS = b.exchange === 'NMS' || b.exchange === 'NYQ' || b.exchDisp === 'NASDAQ' || b.exchDisp === 'NYSE';

       const isAEquity = a.quoteType === 'EQUITY' || a.quoteType === 'ETF';
       const isBEquity = b.quoteType === 'EQUITY' || b.quoteType === 'ETF';

       // Tier 1: General Equity Preference (Punish Futures instantly)
       if (isAEquity && !isBEquity) return -1;
       if (!isAEquity && isBEquity) return 1;

       // Tier 2: Absolute Market Cap Validation
       // If one is a global US mega-cap in a global search, naturally boost it against penny stocks
       if (isAUS && !isBUS && a.score > 15000) return -1;
       if (!isAUS && isBUS && b.score > 15000) return 1;

       // Tier 3: Indian Equities
       if (isAIndia && !isBIndia) return -1;
       if (!isAIndia && isBIndia) return 1;
       
       // Tier 4: Exact Prefix Bias
       const isAExactPrefix = a.shortname && a.shortname.toLowerCase().startsWith(q.toLowerCase());
       const isBExactPrefix = b.shortname && b.shortname.toLowerCase().startsWith(q.toLowerCase());
       if (isAExactPrefix && !isBExactPrefix) return -1;
       if (!isAExactPrefix && isBExactPrefix) return 1;
       
       // Tier 5: Valuation/Liquidity Baseline
       return (b.score || 0) - (a.score || 0);
    });

    return NextResponse.json({ quotes: expandedQuotes });

  } catch (error) {
    console.error("Proxy Search Error", error);
    return NextResponse.json({ quotes: [] });
  }
}
