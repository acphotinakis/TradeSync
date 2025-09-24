import { AISignal } from '../types/trading';

export class AIService {
  private readonly AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

  public async getTradingSignal(symbol: string, historicalData: any[]): Promise<AISignal> {
    try {
      // TODO: Integrate with actual AI service
      const response = await fetch(`${this.AI_SERVICE_URL}/ai/trading-signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          historical_data: historicalData,
          current_price: 150, // Would get from market data
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('AI service unavailable, returning mock signal:', error);
      return this.generateMockSignal(symbol);
    }
  }

  public async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/ai/sentiment-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('AI sentiment analysis unavailable:', error);
      return { sentiment: 'NEUTRAL', score: 0.5 };
    }
  }

  private generateMockSignal(symbol: string): AISignal {
    const signals: Array<'BUY' | 'SELL' | 'HOLD'> = ['BUY', 'SELL', 'HOLD'];
    const randomSignal = signals[Math.floor(Math.random() * signals.length)];
    
    return {
      signal: randomSignal,
      confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      reasoning: `Mock analysis for ${symbol}: ${randomSignal} signal based on simulated market conditions`,
      timestamp: Date.now(),
    };
  }
}

export const aiService = new AIService();