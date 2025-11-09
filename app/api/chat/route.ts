import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Google Gemini API key is not configured. Please add GOOGLE_GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Remove any whitespace from API key
    const cleanApiKey = apiKey.trim();
    
    if (cleanApiKey.length === 0) {
      return NextResponse.json(
        { error: 'API key is empty. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(cleanApiKey);
    
    // Build context-aware prompt
    const systemPrompt = `You are a helpful business analytics assistant for a restaurant business in College Station, TX. Your role is to help the business owner understand their data, make informed decisions, and improve their operations.

${context ? `Current business context:\n${context}\n\n` : ''}

Important context about the business location:
- The restaurant is located in College Station, TX
- The primary customer base includes students from Texas A&M University
- Seasonal patterns are common due to student vacations, especially during summer months (June-July)
- Similar patterns appear at local competitor businesses in the area

IMPORTANT: When users ask about specific ingredients (e.g., "tell me about chicken", "what's happening with beef prices", "market conditions for rice", "supply issues with tomatoes", etc.), you MUST automatically provide comprehensive market intelligence including:

1. **Current Market Conditions**: 
   - Supply availability and demand trends
   - Market stability and volatility
   - Regional considerations (especially for Texas/College Station area)

2. **Latest News & Events**: Share any recent news, events, or developments that could affect supply, including:
   - Weather events (droughts, floods, freezes, hurricanes) affecting production
   - Political or trade policy changes (tariffs, import/export restrictions)
   - Disease outbreaks affecting crops or livestock (avian flu, swine flu, plant diseases)
   - Supply chain disruptions (port closures, transportation issues, labor shortages)
   - Seasonal availability changes
   - Crop reports and harvest conditions
   - Regulatory changes affecting production or distribution

3. **Cost Trends**: Provide detailed information about recent cost changes:
   - Recent price increases and their specific causes
   - Recent price decreases and buying opportunities
   - Expected future price trends (short-term and medium-term forecasts)
   - Comparison to historical prices when relevant
   - Price volatility and risk factors

4. **Supply Chain Information**: 
   - Factors affecting the supply chain for that ingredient
   - Import/export dynamics if applicable
   - Regional supply sources
   - Transportation and logistics considerations

5. **Actionable Recommendations**: Based on the market information, provide specific advice such as:
   - Whether to stock up now or wait for better prices
   - Alternative ingredients if prices are too high or supply is limited
   - Best times to purchase (seasonal buying strategies)
   - Supplier considerations and diversification options
   - Risk mitigation strategies

Use your knowledge (as of your training data) and any available current information to provide the most up-to-date insights. If you're aware of recent events (within the last 1-2 years), mention them with specific dates when possible. Focus on practical, actionable intelligence that helps the business make informed purchasing and inventory decisions.

For all other questions, provide concise, actionable advice based on:
- Data interpretation and insights
- Business optimization suggestions
- Identifying trends and patterns (including seasonal patterns)
- Actionable recommendations
- When discussing sales dips in June/July, explain that this is a seasonal pattern due to students leaving for summer vacation, and note that similar patterns appear at local competitor businesses in College Station, TX

Keep responses clear, professional, and focused on helping improve the business. When discussing ingredients, be thorough and include all relevant market intelligence.`;

    const prompt = `${systemPrompt}\n\nUser question: ${message}\n\nResponse:`;

    // Try different model names in order of preference
    // gemini-2.5-flash is the newest model, then gemini-1.5-flash, gemini-1.5-pro
    // gemini-pro is deprecated and not available
    const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
    let lastError: any = null;

    for (const modelName of modelNames) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from model');
        }
        
        console.log(`Successfully used model: ${modelName}`);
        return NextResponse.json({ response: text });
      } catch (modelError: any) {
        console.error(`Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        // Continue to next model if this one fails
        continue;
      }
    }

    // If all models failed, provide helpful error message
    if (lastError) {
      const errorMsg = lastError.message || 'Unknown error';
      throw new Error(`All model attempts failed. Please check your API key and model availability. Last error: ${errorMsg}`);
    }
    throw new Error('No models were attempted');
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    
    // Return more detailed error information
    const errorMessage = error.message || 'Failed to generate response';
    const isApiKeyError = errorMessage.includes('API_KEY') || errorMessage.includes('api key') || errorMessage.includes('API key');
    
    return NextResponse.json(
      { 
        error: isApiKeyError 
          ? 'Invalid or missing API key. Please check your GOOGLE_GEMINI_API_KEY in .env.local'
          : errorMessage
      },
      { status: 500 }
    );
  }
}

