import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini SDK securely on the server
const apiKey = process.env.GEMINI_API_KEY;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 });
    }

    const { ticker, price, pe, marketCap, high52, low52, revenueGrowth, currency, quoteType, beta, operatingMargins, debtToEquity } = await req.json();
    const isCrypto = quoteType === 'CRYPTOCURRENCY';
    const isForex = quoteType === 'CURRENCY';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING, description: "Professional 2-3 sentence quantitative institutional thesis." },
            risk_level: { type: SchemaType.STRING, description: "One of: LOW, MEDIUM, HIGH, EXTREME" },
            growth_outlook: { type: SchemaType.STRING, description: "One of: BEARISH, NEUTRAL, BULLISH, STRONG BUY, SPECULATIVE" }
          },
          required: ["summary", "risk_level", "growth_outlook"]
        }
      }
    });

    const promptText = `
    Persona: You are a Lead Quantitative Analyst at AXIS CAP Institutional Terminal. Your analysis must be concise, data-driven, and use Wharton-caliber financial terminology.
    
    Context: Analyze the following ${quoteType} asset.
    - Ticker: ${ticker}
    - Valuation: ${currency} ${price}
    - Market Context: 52W Range (${low52} - ${high52}), Market Cap: ${marketCap ? (marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
    - Core Metrics: Beta: ${beta || 'N/A'}, Rev Growth: ${(revenueGrowth * 100).toFixed(2)}%, P/E: ${pe || 'N/A'}
    ${!isCrypto && !isForex ? `- Stability: Op. Margins: ${(operatingMargins * 100).toFixed(2)}%, D/E: ${debtToEquity || 'N/A'}` : ''}
    
    Task:
    1. Formulate a professional "Trading Thesis" for ${ticker}. 
    2. For EQUITIES: Focus on structural price barriers, margin expansion/contraction, and valuation ceilings.
    3. For CRYPTO: Focus on network liquidity nodes, supply scarcity (circulating vs max), and retail-driven momentum oscillators.
    4. For FOREX/COMMODITY: Focus on mean-reversion potentials and macroeconomic risk-hedge characteristics.
    
    CRITICAL: Avoid generic phrases like "is doing well". Use terms like "structural expansion", "liquidity saturation", "mean-reversion thresholds", "institutional accumulation footprints".
    If data is sparse, acknowledge the "data-gap risk" in the summary.
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
