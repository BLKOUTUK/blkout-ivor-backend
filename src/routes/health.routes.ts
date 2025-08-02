import { Router, Request, Response } from 'express';
import { GroqService } from '../services/groq.service';
import { logger } from '../utils/logger';

const router = Router();
const groqService = new GroqService();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check GROQ service
    const groqStatus = groqService.getStatus();
    
    // Check database connection (TODO: implement Supabase check)
    const dbStatus = { connected: true, latency: 0 }; // Placeholder
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'operational',
        ai: groqStatus.available ? 'operational' : 'fallback_mode',
        database: dbStatus.connected ? 'operational' : 'degraded',
        groq: groqStatus
      },
      performance: {
        response_time_ms: responseTime,
        memory_usage: process.memoryUsage(),
        uptime_seconds: process.uptime()
      }
    };

    logger.info('Health check completed', { 
      response_time: responseTime,
      groq_available: groqStatus.available 
    });

    res.json(healthData);
    
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service temporarily unavailable'
    });
  }
});

// Deep health check (includes AI service test)
router.get('/deep', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Test GROQ API
    let groqHealthy = false;
    try {
      groqHealthy = await groqService.healthCheck();
    } catch (error) {
      logger.warn('GROQ health check failed', { error });
    }
    
    const responseTime = Date.now() - startTime;
    
    const deepHealthData = {
      status: groqHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        ai: groqHealthy ? 'operational' : 'fallback_mode',
        groq_api: groqHealthy ? 'operational' : 'unavailable'
      },
      performance: {
        total_check_time_ms: responseTime
      }
    };

    res.json(deepHealthData);
    
  } catch (error) {
    logger.error('Deep health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Deep health check failed'
    });
  }
});

export default router;