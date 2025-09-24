import { AISignal } from '@/types/trading';

// TODO: Replace with actual AI service URL
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

class AIClient {
  async getSignal(symbol: string): Promise<AISignal> {
    const mockSignal: AISignal = {
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'HOLD',
      confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      reasoning: `Simulated analysis for ${symbol} based on market conditions`,
      timestamp: Date.now(),
    };

    try {
      const response = await fetch(`${AI_BASE_URL}/ai/trading-signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          historical_data: [],
          current_price: 150, // TODO: Pass actual current price
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('AI service unavailable, using mock signal:', error);
      return mockSignal;
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
    try {
      const response = await fetch(`${AI_BASE_URL}/ai/sentiment-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('AI sentiment analysis unavailable:', error);
      return { sentiment: 'NEUTRAL', score: 0.5 };
    }
  }
}

export const aiClient = new AIClient();