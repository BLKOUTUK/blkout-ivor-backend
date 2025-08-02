-- BLKOUT IVOR Platform - SQLite Database Schema
-- Self-contained, no external services required

-- Users table - Community member profiles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    preferences TEXT DEFAULT '{}',
    consent_given BOOLEAN DEFAULT 0,
    consent_date DATETIME,
    is_deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME
);

-- Conversations table - Chat sessions with IVOR
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    context TEXT DEFAULT '{}',
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table - Individual chat messages and AI responses
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    conversation_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Community resources table - Knowledge base for IVOR AI context
CREATE TABLE IF NOT EXISTS community_resources (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT,
    organization TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Community stats table - Live statistics for dashboard
CREATE TABLE IF NOT EXISTS community_stats (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    stat_name TEXT UNIQUE NOT NULL,
    stat_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category TEXT DEFAULT 'general'
);

-- Feedback table - User feedback on AI responses for learning
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    message_id TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Events table - Community events and gatherings
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location TEXT,
    event_type TEXT DEFAULT 'community',
    is_virtual BOOLEAN DEFAULT 0,
    max_attendees INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_community_resources_category ON community_resources(category);
CREATE INDEX IF NOT EXISTS idx_community_resources_active ON community_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);

-- Initial community statistics
INSERT OR REPLACE INTO community_stats (stat_name, stat_value, category) VALUES 
('total_members', '12847', 'membership'),
('active_discussions', '23', 'engagement'),
('weekly_events', '5', 'events'),
('mutual_aid_requests', '8', 'community'),
('liberation_stories', '156', 'content'),
('community_projects', '12', 'projects'),
('growth_rate', '"+15% this month"', 'analytics'),
('engagement_score', '8.7', 'analytics');

-- Sample community resources
INSERT OR REPLACE INTO community_resources (id, title, content, category, organization, location) VALUES 
('resource_001', 'Mental Health Support for QTIPOC', 'Black Thrive BQC offers culturally competent mental health support specifically for Black queer and trans people in South London.', 'mental_health', 'Black Thrive BQC', 'South London'),
('resource_002', 'LGBTQ+ Housing Support', 'The Outside Project provides emergency accommodation and housing support specifically for LGBTQ+ people experiencing homelessness.', 'housing', 'Outside Project', 'London'),
('resource_003', 'Benefits and Welfare Rights', 'Citizens Advice offers free, confidential advice on benefits, debt, and legal issues. LGBT Foundation also provides welfare rights support.', 'financial', 'Citizens Advice / LGBT Foundation', 'UK-wide'),
('resource_004', 'Trans Healthcare Support', 'CliniQ offers sexual health services for trans and non-binary people with culturally competent care.', 'healthcare', 'CliniQ', 'London'),
('resource_005', 'Employment Rights Support', 'ACAS provides free employment advice including discrimination cases. LGBT Foundation offers workplace support.', 'employment', 'ACAS / LGBT Foundation', 'UK-wide');

-- Sample events
INSERT OR REPLACE INTO events (id, title, description, event_date, location, event_type, is_virtual) VALUES 
('event_001', 'QTIPOC Community Gathering', 'Monthly community meeting for QTIPOC folks to connect, share experiences, and support each other.', '2025-01-15 18:00:00', 'Community Center, London', 'community', 0),
('event_002', 'Mutual Aid Workshop', 'Learn about organizing mutual aid in your community and building collective support networks.', '2025-01-22 19:00:00', 'Online', 'workshop', 1),
('event_003', 'Black Trans History Month Event', 'Celebrating Black trans history and current community leaders with talks and performances.', '2025-02-10 16:00:00', 'South London', 'celebration', 0);