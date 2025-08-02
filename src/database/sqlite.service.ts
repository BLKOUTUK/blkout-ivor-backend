import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_active: string;
  preferences: string;
  consent_given: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  started_at: string;
  last_message_at: string;
  context: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  rating?: number;
  metadata: string;
}

export interface CommunityResource {
  id: string;
  title: string;
  content: string;
  category: string;
  url?: string;
  organization?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CommunityStats {
  id: string;
  stat_name: string;
  stat_value: string;
  updated_at: string;
  category: string;
}

export class SQLiteService {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    // Use a data directory for the database
    const dataDir = path.join(process.cwd(), 'data');
    this.dbPath = path.join(dataDir, 'blkout_ivor.sqlite');
  }

  /**
   * Initialize the SQLite database
   */
  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // Open database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');

      // Run schema setup
      await this.setupSchema();

      logger.info('SQLite database initialized successfully', { 
        dbPath: this.dbPath 
      });

    } catch (error) {
      logger.error('Failed to initialize SQLite database', { error });
      throw error;
    }
  }

  /**
   * Set up database schema
   */
  private async setupSchema(): Promise<void> {
    try {
      const schemaPath = path.join(__dirname, 'sqlite.setup.sql');
      const schema = await fs.readFile(schemaPath, 'utf-8');
      
      await this.db!.exec(schema);
      logger.info('Database schema setup completed');
      
    } catch (error) {
      logger.error('Failed to setup database schema', { error });
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDB(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Get all community statistics
   */
  async getCommunityStats(): Promise<CommunityStats[]> {
    const db = this.getDB();
    return await db.all(
      'SELECT * FROM community_stats ORDER BY category, stat_name'
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId?: string): Promise<Conversation> {
    const db = this.getDB();
    const conversationId = this.generateId();
    
    await db.run(
      `INSERT INTO conversations (id, user_id, started_at, last_message_at) 
       VALUES (?, ?, datetime('now'), datetime('now'))`,
      [conversationId, userId || null]
    );

    const conversation = await db.get(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    );

    return conversation as Conversation;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata: any = {}
  ): Promise<Message> {
    const db = this.getDB();
    const messageId = this.generateId();

    await db.run(
      `INSERT INTO messages (id, conversation_id, role, content, metadata) 
       VALUES (?, ?, ?, ?, ?)`,
      [messageId, conversationId, role, content, JSON.stringify(metadata)]
    );

    // Update conversation last_message_at
    await db.run(
      `UPDATE conversations 
       SET last_message_at = datetime('now') 
       WHERE id = ?`,
      [conversationId]
    );

    const message = await db.get(
      'SELECT * FROM messages WHERE id = ?',
      [messageId]
    );

    return message as Message;
  }

  /**
   * Get conversation history
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const db = this.getDB();
    return await db.all(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
      [conversationId]
    );
  }

  /**
   * Search community resources by category or content
   */
  async searchCommunityResources(
    query?: string,
    category?: string
  ): Promise<CommunityResource[]> {
    const db = this.getDB();
    
    let sql = 'SELECT * FROM community_resources WHERE is_active = 1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (query) {
      sql += ' AND (title LIKE ? OR content LIKE ? OR organization LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY title';

    return await db.all(sql, params);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 10): Promise<any[]> {
    const db = this.getDB();
    return await db.all(
      `SELECT * FROM events 
       WHERE is_active = 1 AND event_date >= datetime('now') 
       ORDER BY event_date ASC 
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Add feedback for a message
   */
  async addFeedback(
    messageId: string,
    rating: number,
    feedbackText?: string,
    userId?: string
  ): Promise<void> {
    const db = this.getDB();
    const feedbackId = this.generateId();

    await db.run(
      `INSERT INTO feedback (id, message_id, rating, feedback_text, user_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [feedbackId, messageId, rating, feedbackText || null, userId || null]
    );

    // Update message rating
    await db.run(
      'UPDATE messages SET rating = ? WHERE id = ?',
      [rating, messageId]
    );
  }

  /**
   * Health check - verify database is working
   */
  async healthCheck(): Promise<boolean> {
    try {
      const db = this.getDB();
      const result = await db.get('SELECT COUNT(*) as count FROM community_stats');
      return result.count >= 0;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  }

  /**
   * Generate a simple ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }
}