import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    
    // Try newer model first, then fallback
    const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError: any = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello" in one word');
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ 
          success: true, 
          message: 'API is working!',
          response: text,
          model: modelName
        });
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }
    
    throw lastError || new Error('All models failed');
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      details: error.stack,
    }, { status: 500 });
  }
}

