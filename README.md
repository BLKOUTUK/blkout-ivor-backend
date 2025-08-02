# BLKOUT IVOR Backend - QTIPOC Community AI Assistant

A production-ready backend API for the BLKOUT IVOR Platform, featuring GROQ AI integration with IVOR persona system and self-contained SQLite database.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your GROQ API key
```

3. **Run development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3001` with:
- SQLite database automatically created at `./data/blkout_ivor.sqlite`
- IVOR AI persona system ready
- Full API endpoints available

### Production Deployment (Railway)

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to Railway:**
- Connect your GitHub repository to Railway
- Set environment variables in Railway dashboard
- Deploy automatically on push to main branch

## 📊 API Endpoints

### Health Checks
- `GET /health` - Server health status
- `GET /health/db` - Database connectivity

### Chat API
- `POST /api/chat` - Send message to IVOR AI
- `GET /api/chat/conversations/:id` - Get conversation history
- `POST /api/chat/feedback` - Submit message feedback

### Community Data
- `GET /api/community/stats` - Community statistics

## 🗄️ Database

Uses SQLite for simplicity and portability:
- **Local:** `./data/blkout_ivor.sqlite`
- **Production:** Automatic Railway volume mounting
- **No external services required**

### Schema
- `users` - Community member profiles
- `conversations` - Chat sessions with IVOR
- `messages` - Individual chat messages and AI responses
- `community_resources` - Knowledge base for IVOR AI context
- `community_stats` - Live statistics for dashboard
- `feedback` - User feedback on AI responses
- `events` - Community events and gatherings

## 🤖 IVOR AI System

Based on Ivor Cummings (1916-1991), featuring:
- **GROQ API Integration** with Llama2-70b model
- **QTIPOC Community Focus** with UK-specific knowledge
- **Fallback Responses** when AI is unavailable
- **Community Resource Integration**

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Railway Deployment
- Automatically detects Node.js
- Uses `npm start` command
- SQLite database persists in Railway volumes
- No additional configuration required

## 🛡️ Security Features

- **CORS Protection** with configurable origins
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **Helmet.js** security headers
- **Request Logging** with Winston

## 📝 Development Scripts

```bash
npm run dev     # Start development server with hot reload
npm run build   # Build TypeScript to JavaScript
npm start       # Start production server
npm run lint    # Run ESLint checks
npm test        # Run Jest tests
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic (GROQ, IVOR persona)
│   ├── database/         # SQLite service and schema
│   ├── utils/           # Logging and utilities
│   └── server.ts        # Main server file
├── data/                # SQLite database location
└── dist/                # Compiled JavaScript output
```

## 🎯 Key Features

- **Self-Contained:** No external database services required
- **AI-Powered:** GROQ API with IVOR persona system
- **Production-Ready:** Security, logging, and error handling
- **QTIPOC-Focused:** Community-specific knowledge and responses
- **Scalable:** Ready for Railway deployment
- **Maintainable:** TypeScript, ESLint, and structured architecture

---

Built with ❤️ for the BLKOUT UK community