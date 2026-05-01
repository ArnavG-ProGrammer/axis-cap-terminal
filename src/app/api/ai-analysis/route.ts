import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 });
    }

    const body = await req.json();
    
    // Strict Input Sanitization
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
    }
    
    if (typeof body.ticker !== 'string' || body.ticker.length > 20 || !/^[A-Za-z0-9=.\-:]+$/.test(body.ticker)) {
      return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
    }
    
    // Ensure critical numerical fields are actually numbers and not excessively large (e.g. buffer overflows)
    const sanitizeNumber = (val: any) => typeof val === 'number' && isFinite(val) && val < 1e15 && val > -1e15 ? val : 0;

    const { 
      ticker, currency, quoteType,
      price: rawPrice, pe: rawPe, marketCap: rawMarketCap, high52: rawHigh52, low52: rawLow52, 
      revenueGrowth: rawRev, beta: rawBeta, operatingMargins: rawOp, debtToEquity: rawDebt, 
      volume: rawVol, bookValue: rawBook, eps: rawEps, forwardPE: rawFpe, profitMargins: rawProf, 
      pegRatio: rawPeg, freeCashflow: rawFcf, dcfIntrinsic: rawDcf 
    } = body;

    const price = sanitizeNumber(rawPrice);
    const pe = sanitizeNumber(rawPe);
    const marketCap = sanitizeNumber(rawMarketCap);
    const high52 = sanitizeNumber(rawHigh52);
    const low52 = sanitizeNumber(rawLow52);
    const revenueGrowth = sanitizeNumber(rawRev);
    const beta = sanitizeNumber(rawBeta);
    const operatingMargins = sanitizeNumber(rawOp);
    const debtToEquity = sanitizeNumber(rawDebt);
    const volume = sanitizeNumber(rawVol);
    const bookValue = sanitizeNumber(rawBook);
    const eps = sanitizeNumber(rawEps);
    const forwardPE = sanitizeNumber(rawFpe);
    const profitMargins = sanitizeNumber(rawProf);
    const pegRatio = sanitizeNumber(rawPeg);
    const freeCashflow = sanitizeNumber(rawFcf);
    const dcfIntrinsic = sanitizeNumber(rawDcf);

    const isCrypto = quoteType === 'CRYPTOCURRENCY';
    const isForex = quoteType === 'CURRENCY';

    // Calculate position within 52W range for context
    const range52 = (high52 && low52 && high52 > low52) ? ((price - low52) / (high52 - low52) * 100) : 50;
    const fcfYield = (freeCashflow && marketCap > 0) ? ((freeCashflow / marketCap) * 100) : null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING, description: "Professional 4-5 sentence deep quantitative institutional thesis. Must reference specific numbers from the data provided. Each sentence should add a distinct analytical dimension." },
            risk_level: { type: SchemaType.STRING, description: "One of: LOW, MEDIUM, HIGH, EXTREME" },
            growth_outlook: { type: SchemaType.STRING, description: "One of: BEARISH, NEUTRAL, BULLISH, STRONG BUY, SPECULATIVE" },
            key_metric: { type: SchemaType.STRING, description: "The single most important metric driving the thesis (e.g. 'P/E of 32.5x is 40% above sector median')" },
            catalyst: { type: SchemaType.STRING, description: "One sentence describing the primary catalyst or risk factor" }
          },
          required: ["summary", "risk_level", "growth_outlook", "key_metric", "catalyst"]
        }
      }
    });

    // Build comprehensive data context
    let dataBlock = `
    ASSET: ${ticker} (${quoteType})
    PRICE: ${currency} ${price}
    52-WEEK RANGE: ${currency} ${low52} — ${high52} (Currently at ${range52.toFixed(1)}% of range)
    MARKET CAP: ${marketCap ? (marketCap / 1e9).toFixed(2) + 'B ' + currency : 'N/A'}
    DAILY VOLUME: ${volume ? (volume / 1e6).toFixed(2) + 'M' : 'N/A'}
    `;

    if (!isCrypto && !isForex) {
      dataBlock += `
      EPS (TTM): ${eps || 'N/A'}
      P/E (TTM): ${pe ? pe.toFixed(2) + 'x' : 'N/A'}
      FORWARD P/E: ${forwardPE ? forwardPE.toFixed(2) + 'x' : 'N/A'}
      PEG RATIO: ${pegRatio || 'N/A'}
      BOOK VALUE: ${currency} ${bookValue || 'N/A'}
      BETA: ${beta || 'N/A'}
      REVENUE GROWTH: ${(revenueGrowth * 100).toFixed(2)}%
      OPERATING MARGIN: ${(operatingMargins * 100).toFixed(2)}%
      NET MARGIN: ${(profitMargins * 100).toFixed(2)}%
      DEBT/EQUITY: ${debtToEquity || 'N/A'}
      FCF YIELD: ${fcfYield ? fcfYield.toFixed(2) + '%' : 'N/A'}
      DCF INTRINSIC VALUE: ${dcfIntrinsic ? currency + ' ' + dcfIntrinsic.toFixed(2) : 'N/A'}
      `;
    }

    const promptText = `
    ROLE: You are a Lead Quantitative Analyst at AXIS CAP Institutional Terminal. Write a UNIQUE, DATA-SPECIFIC analysis.

    ${dataBlock}

    INSTRUCTIONS:
    1. Your summary MUST reference at least 3 specific numbers from the data above.
    2. Compare the current price to DCF intrinsic value and 52W range position.
    3. Identify the biggest risk AND the biggest opportunity visible in the data.
    4. For EQUITIES: Analyze P/E vs growth (PEG), margin quality, and balance sheet leverage.
    5. For CRYPTO: Analyze price relative to 52W range, volume trends, and market cap dominance.
    6. For FOREX: Analyze volatility, mean-reversion dynamics, and macro positioning.
    7. NEVER use vague phrases like "is performing well" or "shows promise". Every sentence must contain a quantitative reference.
    8. The analysis must be COMPLETELY DIFFERENT for each asset — it should be impossible to confuse analyses of two different stocks.
    `;

    const result = await model.generateContent(promptText);
    const textResponse = result.response.text();
    
    const parsed = JSON.parse(textResponse);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: 'AI temporarily unavailable' }, { status: 500 });
  }
}
