import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

function translateSymbol(symbol: string): string {
  if (!symbol) return '';
  const s = symbol.toUpperCase();
  
  // NSE/BSE India
  if (s.startsWith('NSE:')) return s.replace('NSE:', '') + '.NS';
  if (s.startsWith('BSE:')) return s.replace('BSE:', '') + '.BO';
  
  // Crypto (Common exchanges)
  if (s.startsWith('BINANCE:') || s.startsWith('COINBASE:') || s.startsWith('KRAKEN:') || s.startsWith('BITSTAMP:')) {
    let ticker = s.split(':')[1];
    // Remove USDT/USD suffix and standardize to -USD for Yahoo
    ticker = ticker.replace(/USDT$/, '').replace(/USD$/, '');
    return ticker + '-USD';
  }
  
  // Forex
  if (s.startsWith('FX:')) {
    let pair = s.replace('FX:', '');
    return pair + '=X';
  }

  // Handle common Yahoo formats already present
  if (s.includes('.NS') || s.includes('.BO') || s.includes('-USD') || s.includes('=X')) return s;

  return s;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawSymbol = url.searchParams.get('q');

    if (!rawSymbol) {
      return NextResponse.json({ error: 'No ticker provided' }, { status: 400 });
    }

    const translatedSymbol = translateSymbol(rawSymbol);

    // Attempt 1: Specific Ticker Search
    let result = await yahooFinance.search(translatedSymbol, { newsCount: 10 });
    
    // Attempt 2: If no news, try searching for the raw ticker
    if ((!result.news || result.news.length === 0) && translatedSymbol !== rawSymbol) {
      result = await yahooFinance.search(rawSymbol, { newsCount: 10 });
    }

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
