import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { IvorPersona } from '../services/ivor.persona';
import { GroqService } from '../services/groq.service';
import { logger } from '../utils/logger';

const router = Router();
const ivorPersona = new IvorPersona();
const groqService = new GroqService();

// Chat endpoint with GROQ integration
router.post('/', 
  [
    body('message').isString().trim().isLength({ min: 1, max: 2000 }),
    body('conversation_id').optional().isUUID(),
    body('user_id').optional().isUUID()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: errors.array() 
        });
      }

      const { message, conversation_id, user_id } = req.body;
      
      logger.info('Chat request received', { 
        message_length: message.length,
        conversation_id,
        user_id 
      });

      // Get enhanced prompt with IVOR persona
      const enhancedPrompt = ivorPersona.enhancePrompt(message);
      
      try {
        // Try GROQ API first
        const aiResponse = await groqService.generateResponse(enhancedPrompt);
        
        // Process response through IVOR persona
        const ivorResponse = ivorPersona.processResponse(aiResponse, message);
        
        logger.info('GROQ response generated successfully');
        
        return res.json({
          response: ivorResponse,
          model: 'groq_llama2-70b',
          source: 'groq_api',
          confidence: 0.95,
          timestamp: new Date().toISOString(),
          mode: 'groq',
          conversation_id: conversation_id || null
        });
        
      } catch (groqError) {
        logger.warn('GROQ API failed, using fallback', { error: groqError });
        
        // Fallback to IVOR community responses
        const fallbackResponse = ivorPersona.getFallbackResponse(message);
        
        return res.json({
          response: fallbackResponse,
          model: 'ivor_community_knowledge',
          source: 'qtipoc_local_knowledge',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
          mode: 'fallback',
          conversation_id: conversation_id || null
        });
      }
      
    } catch (error) {
      logger.error('Chat endpoint error', { error });
      
      // Emergency fallback
      const emergencyResponse = "I'm experiencing some technical difficulties right now, but I'm still here for you. " +
        "The BLKOUT community is strong, and we support each other through all challenges. " +
        "Please try again in a moment, or reach out through our other community channels.";
      
      res.status(500).json({
        response: emergencyResponse,
        model: 'emergency_fallback',
        source: 'static_response',
        confidence: 0.7,
        timestamp: new Date().toISOString(),
        mode: 'emergency',
        error: 'Temporary service disruption'
      });
    }
  }
);

// Get conversation history
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement conversation retrieval from Supabase
    res.json({
      conversation_id: id,
      messages: [],
      status: 'active'
    });
    
  } catch (error) {
    logger.error('Conversation retrieval error', { error });
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

export default router;