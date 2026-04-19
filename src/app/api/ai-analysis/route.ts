import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini SDK securely on the server
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { ticker, price, pe, marketCap, high52, low52, revenueGrowth } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING, description: "1-2 sentence overview" },
            risk_level: { type: SchemaType.STRING, description: "One of: LOW, MEDIUM, HIGH" },
            growth_outlook: { type: SchemaType.STRING, description: "One of: BEARISH, NEUTRAL, BULLISH, STRONG BUY" }
          },
          required: ["summary", "risk_level", "growth_outlook"]
        }
      }
    });

    const promptText = `
    You are a strictly quantitative financial AI for an institutional terminal called AXIS CAP.
    Analyze the following asset based ONLY on the numbers provided. Do NOT hallucinate news, earnings, or external macro events not provided here.
    If the data is null/insufficient, output NEUTRAL risk and mention the lack of data in your summary.
    Keep the summary to strictly 1-2 powerful sentences. 
    
    Data input:
    Ticker: ${ticker}
    Current Price: $${price}
    P/E Ratio: ${pe > 0 ? pe.toFixed(2) : 'N/A'}
    Market Cap: ${marketCap ? (marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
    52-Week Range: $${low52} - $${high52}
    Revenue Growth: ${(revenueGrowth * 100).toFixed(2)}%
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
