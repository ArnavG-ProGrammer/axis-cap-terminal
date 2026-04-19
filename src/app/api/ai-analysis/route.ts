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
    PERSONA: You are a Senior Equity Research Analyst at a Tier-1 institutional firm. Your client base consists of ultra-high-net-worth investors and sovereign wealth funds.
    
    DATA DECK [STRICT ANTI-HALLUCINATION FRAMEWORK]:
    - Asset: ${ticker} (${quoteType})
    - Current Valuation: ${currency} ${price}
    - Fundamental Metrics: P/E: ${pe || 'N/A'}, Beta: ${beta || 'N/A'}, Rev Growth: ${(revenueGrowth * 100).toFixed(2)}%
    - Balance Sheet Stability: Op. Margins: ${(operatingMargins * 100).toFixed(2)}%, D/E: ${debtToEquity || 'N/A'}
    - Market Context: Cap: ${marketCap ? (marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}, 52W Range: [${low52} - ${high52}]
    
    EXECUTIVE TASK:
    Write a sophisticated "Investment Committee Memo" (2-3 dense, impactful paragraphs). 
    
    ANALYTIC REQUIREMENTS:
    1. CROSS-METRIC ANALYSIS: Do not just list numbers. Analyze the *interplay* (e.g., "The divergence between high Beta and stable operating margins suggests a volatility profile driven by liquidity node shifting rather than structural decay").
    2. ASSET-CLASS PRECISION: 
       - For CRYPTO: Discuss network value models, supply-side scarcity, and institutional accumulation footprints.
       - For EQUITY: Discuss margin-of-safety, structural sector barriers, and EBITDA/PE yield spreads.
       - For FOREX: Discuss carry-trade viability and volatility-mean-reversion thresholds.
    3. TERMINOLOGY: Use institutional-grade vocabulary: "Alpha-decoupling", "Asymmetric risk-reward", "Structural capitulation", "Mean-reversion vectors".
    
    CRITICAL: YOU ARE FORBIDDEN FROM HALLUCINATING NEWS. IF DATA IS THIN, FLAG THE "ANALYTIC VOID" AS A RISK FACTOR. 
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
