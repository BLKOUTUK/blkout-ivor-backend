import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { IvorPersona } from '../services/ivor.persona';
import { GroqService } from '../services/groq.service';
import { SQLiteService } from '../database/sqlite.service';
import { logger } from '../utils/logger';

const router = Router();
const ivorPersona = new IvorPersona();
const groqService = new GroqService();
const sqliteService = new SQLiteService();

// Initialize SQLite database
sqliteService.initialize().catch(error => {
  logger.error('Failed to initialize SQLite database', { error });
});

// Chat endpoint with GROQ integration and SQLite storage
router.post('/', 
  [
    body('message').isString().trim().isLength({ min: 1, max: 2000 }),
    body('conversation_id').optional().isString(),
    body('user_id').optional().isString()
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

      // Create or get conversation
      let conversationId = conversation_id;
      if (!conversationId) {
        const conversation = await sqliteService.createConversation(user_id);
        conversationId = conversation.id;
        logger.info('New conversation created', { conversationId });
      }

      // Store user message
      await sqliteService.addMessage(conversationId, 'user', message);

      // Get enhanced prompt with IVOR persona
      const enhancedPrompt = ivorPersona.enhancePrompt(message);
      
      try {
        // Try GROQ API first
        const aiResponse = await groqService.generateResponse(enhancedPrompt);
        
        // Process response through IVOR persona
        const ivorResponse = ivorPersona.processResponse(aiResponse, message);
        
        // Store AI response
        await sqliteService.addMessage(
          conversationId, 
          'assistant', 
          ivorResponse,
          { 
            model: 'groq_llama2-70b',
            source: 'groq_api',
            confidence: 0.95 
          }
        );
        
        logger.info('GROQ response generated and stored');
        
        return res.json({
          response: ivorResponse,
          model: 'groq_llama2-70b',
          source: 'groq_api',
          confidence: 0.95,
          timestamp: new Date().toISOString(),
          mode: 'groq',
          conversation_id: conversationId
        });
        
      } catch (groqError) {
        logger.warn('GROQ API failed, using fallback', { error: groqError });
        
        // Fallback to IVOR community responses
        const fallbackResponse = ivorPersona.getFallbackResponse(message);
        
        // Store fallback response
        await sqliteService.addMessage(
          conversationId,
          'assistant',
          fallbackResponse,
          {
            model: 'ivor_community_knowledge',
            source: 'qtipoc_local_knowledge',
            confidence: 0.85,
            fallback_reason: 'groq_api_unavailable'
          }
        );
        
        return res.json({
          response: fallbackResponse,
          model: 'ivor_community_knowledge',
          source: 'qtipoc_local_knowledge',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
          mode: 'fallback',
          conversation_id: conversationId
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
    
    const messages = await sqliteService.getConversationMessages(id);
    
    res.json({
      conversation_id: id,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        rating: msg.rating,
        metadata: JSON.parse(msg.metadata || '{}')
      })),
      status: 'active'
    });
    
  } catch (error) {
    logger.error('Conversation retrieval error', { error });
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

// Add feedback to a message
router.post('/feedback', 
  [
    body('message_id').isString(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('feedback_text').optional().isString(),
    body('user_id').optional().isString()
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

      const { message_id, rating, feedback_text, user_id } = req.body;
      
      await sqliteService.addFeedback(message_id, rating, feedback_text, user_id);
      
      logger.info('Feedback added', { message_id, rating });
      
      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });
      
    } catch (error) {
      logger.error('Feedback error', { error });
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  }
);

export default router;