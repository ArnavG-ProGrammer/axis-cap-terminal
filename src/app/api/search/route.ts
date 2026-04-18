import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ quotes: [] });
    }

    // Multi-Region Parallel Fetch: US, India, UK, Europe, Asia
    const regions = [
      { region: 'US', lang: 'en-US' },
      { region: 'IN', lang: 'en-IN' },
      { region: 'GB', lang: 'en-GB' },
      { region: 'DE', lang: 'de-DE' },
      { region: 'HK', lang: 'zh-HK' },
      { region: 'JP', lang: 'ja-JP' },
    ];

    const fetches = regions.map(r =>
      fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=30&newsCount=0&region=${r.region}&lang=${r.lang}`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
      }).catch(() => null)
    );

    const responses = await Promise.all(fetches);

    let rawQuotes: any[] = [];
    for (const res of responses) {
      if (res && res.ok) {
        try {
          const data = await res.json();
          if (data.quotes) rawQuotes = [...rawQuotes, ...data.quotes];
        } catch { /* skip malformed */ }
      }
    }

    // Deduplicate by symbol
    const seenSymbols = new Set();
    let quotes: any[] = [];

    for (const item of rawQuotes) {
      if (!item.symbol) continue;

      // Only filter out truly unwanted types: options, warrants, bonds, futures (keep everything else)
      const blockedTypes = ['OPTION', 'WARRANT', 'BOND', 'NONE'];
      if (blockedTypes.includes(item.quoteType)) continue;

      // For crypto, only keep USD base pairs to avoid duplicates
      if (item.quoteType === 'CRYPTOCURRENCY' && !item.symbol.endsWith('-USD')) continue;

      if (!seenSymbols.has(item.symbol)) {
        seenSymbols.add(item.symbol);
        quotes.push(item);
      }
    }

    // Auto-inject NSE variants for BSE stocks
    const expandedQuotes: any[] = [];
    quotes.forEach((q: any) => {
      expandedQuotes.push(q);
      if (q.symbol && q.symbol.endsWith('.BO') && !seenSymbols.has(q.symbol.replace('.BO', '.NS'))) {
        const nseVariant = {
          ...q,
          symbol: q.symbol.replace('.BO', '.NS'),
          exchDisp: 'NSE',
          exchange: 'NSI'
        };
        expandedQuotes.push(nseVariant);
        seenSymbols.add(nseVariant.symbol);
      }
      // Also inject BSE variant if only NSE exists
      if (q.symbol && q.symbol.endsWith('.NS') && !seenSymbols.has(q.symbol.replace('.NS', '.BO'))) {
        const bseVariant = {
          ...q,
          symbol: q.symbol.replace('.NS', '.BO'),
          exchDisp: 'BSE',
          exchange: 'BSE'
        };
        expandedQuotes.push(bseVariant);
        seenSymbols.add(bseVariant.symbol);
      }
    });

    // Sort: Equities first, then by relevance score
    expandedQuotes.sort((a, b) => {
      const isAIndia = a.symbol?.endsWith('.NS') || a.symbol?.endsWith('.BO');
      const isBIndia = b.symbol?.endsWith('.NS') || b.symbol?.endsWith('.BO');

      const isAEquity = a.quoteType === 'EQUITY' || a.quoteType === 'ETF';
      const isBEquity = b.quoteType === 'EQUITY' || b.quoteType === 'ETF';

      // Tier 1: Equities first
      if (isAEquity && !isBEquity) return -1;
      if (!isAEquity && isBEquity) return 1;

      // Tier 2: Exact symbol/name prefix match
      const qLower = q.toLowerCase();
      const isAExact = a.symbol?.toLowerCase().startsWith(qLower) || (a.shortname?.toLowerCase().startsWith(qLower));
      const isBExact = b.symbol?.toLowerCase().startsWith(qLower) || (b.shortname?.toLowerCase().startsWith(qLower));
      if (isAExact && !isBExact) return -1;
      if (!isAExact && isBExact) return 1;

      // Tier 3: Indian stocks boosted for Indian queries
      if (isAIndia && !isBIndia) return -1;
      if (!isAIndia && isBIndia) return 1;

      // Tier 4: Score
      return (b.score || 0) - (a.score || 0);
    });

    return NextResponse.json({ quotes: expandedQuotes });

  } catch (error) {
    console.error("Proxy Search Error", error);
    return NextResponse.json({ quotes: [] });
  }
}
