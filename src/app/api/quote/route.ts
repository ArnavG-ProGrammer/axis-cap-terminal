import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'No query' }, { status: 400 });
    }

    // Bypass Yahoo's v7 cookie requirement by fetching directly from their v8 Chart API
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(q)}?interval=1d&range=1d`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
    }

    const data = await response.json();
    const result = data.chart?.result?.[0]?.meta;

    if (!result) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Unpack data identically so the UI proxy remains intact
    return NextResponse.json({ 
       price: result.regularMarketPrice || 0,
       change: (result.regularMarketPrice - result.chartPreviousClose) || 0,
       changePercent: (((result.regularMarketPrice - result.chartPreviousClose) / result.chartPreviousClose) * 100) || 0,
       volume: result.regularMarketVolume || 0,
       marketCap: 0, // Fallback if meta doesn't directly support marketCap on all assets
       name: result.shortName || result.longName || q,
       currency: result.currency || 'USD'
    });

  } catch (error) {
    console.error("Proxy Quote Error", error);
    return NextResponse.json({ error: 'Internal Server Crash' }, { status: 500 });
  }
}
