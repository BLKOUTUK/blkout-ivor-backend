import Groq from 'groq-sdk';
import { logger } from '../utils/logger';

export class GroqService {
  private groq: Groq;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  /**
   * Generate AI response using GROQ with retry logic
   */
  async generateResponse(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`GROQ API attempt ${attempt}/${this.maxRetries}`);

        const completion = await this.groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama2-70b-4096', // High-quality model for community support
          temperature: 0.7, // Balanced creativity and consistency
          max_tokens: 500, // Reasonable response length
          top_p: 0.9,
          stream: false
        });

        const response = completion.choices[0]?.message?.content;
        
        if (!response) {
          throw new Error('Empty response from GROQ API');
        }

        logger.info('GROQ API response generated successfully', {
          response_length: response.length,
          attempt
        });

        return response.trim();

      } catch (error) {
        lastError = error as Error;
        logger.warn(`GROQ API attempt ${attempt} failed`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt 
        });

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    logger.error('All GROQ API attempts failed', { 
      error: lastError?.message,
      attempts: this.maxRetries 
    });
    
    throw new Error(`GROQ API failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Check if GROQ service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.generateResponse("Hello, this is a health check. Please respond with 'OK'.");
      return testResponse.toLowerCase().includes('ok');
    } catch (error) {
      logger.error('GROQ health check failed', { error });
      return false;
    }
  }

  /**
   * Get service status information
   */
  getStatus(): { available: boolean; model: string; configured: boolean } {
    return {
      available: !!process.env.GROQ_API_KEY,
      model: 'llama2-70b-4096',
      configured: !!this.groq
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}