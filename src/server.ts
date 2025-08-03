import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services
import { SQLiteService } from './database/sqlite.service';
import chatRoutes from './routes/chat.routes.sqlite';

// Import utilities
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize SQLite database
const sqliteService = new SQLiteService();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🏳️‍🌈 BLKOUT IVOR Platform API',
    version: '1.0.0',
    status: 'active',
    community: 'QTIPOC Liberation',
    environment: NODE_ENV,
    database: 'SQLite (self-contained)',
    ai_enabled: !!process.env.GROQ_API_KEY,
    ivor_persona: 'Based on Ivor Cummings (1916-1991)'
  });
});

// Health check endpoint - simplified for Railway
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '1.0.0',
    port: PORT
  });
});

// Database health check endpoint
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    const isHealthy = await sqliteService.healthCheck();
    
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      type: 'sqlite',
      timestamp: new Date().toISOString(),
      records_accessible: true
    });
    
  } catch (error) {
    logger.error('Database health check failed', { error });
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      type: 'sqlite',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Community stats endpoint
app.get('/api/community/stats', async (req: Request, res: Response) => {
  try {
    const stats = await sqliteService.getCommunityStats();
    
    // Transform data for frontend
    const transformedStats = stats.reduce((acc: any, stat: any) => {
      acc[stat.stat_name] = {
        value: stat.stat_value,
        category: stat.category,
        updated_at: stat.updated_at
      };
      return acc;
    }, {});
    
    res.json({ 
      success: true,
      stats: transformedStats,
      last_updated: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to fetch community stats', { error });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch community statistics',
      fallback_stats: {
        total_members: { value: '12000+', category: 'membership' },
        active_discussions: { value: '20+', category: 'engagement' },
        weekly_events: { value: '5', category: 'events' }
      }
    });
  }
});

// Community resources endpoint
app.get('/api/community/resources', async (req: Request, res: Response) => {
  try {
    const { category, query } = req.query;
    const resources = await sqliteService.searchCommunityResources(
      query as string,
      category as string
    );
    
    res.json({
      success: true,
      resources,
      count: resources.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to fetch community resources', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community resources',
      resources: []
    });
  }
});

// Events endpoint
app.get('/api/community/events', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const events = await sqliteService.getUpcomingEvents(
      limit ? parseInt(limit as string) : 10
    );
    
    res.json({
      success: true,
      events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to fetch events', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      events: []
    });
  }
});

// API routes
app.use('/api/chat', chatRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'Please check the API documentation for available endpoints',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /health/db',
      'GET /api/community/stats',
      'GET /api/community/resources',
      'GET /api/community/events',
      'POST /api/chat',
      'GET /api/chat/conversations/:id',
      'POST /api/chat/feedback'
    ]
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong. Please try again later.',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sqliteService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sqliteService.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Initialize SQLite database
    await sqliteService.initialize();
    logger.info('SQLite database initialized successfully');
    
    app.listen(PORT, () => {
      logger.info(`🚀 BLKOUT IVOR Backend Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🗄️  Database health: http://localhost:${PORT}/health/db`);
      logger.info(`💬 Chat API: http://localhost:${PORT}/api/chat`);
      logger.info(`📈 Community stats: http://localhost:${PORT}/api/community/stats`);
      logger.info(`🎯 Environment: ${NODE_ENV}`);
      logger.info(`💾 Database: SQLite (self-contained)`);
      logger.info(`🌍 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      logger.info(`🤖 IVOR Persona: ${process.env.GROQ_API_KEY ? 'AI-Enhanced' : 'Community Fallback'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;