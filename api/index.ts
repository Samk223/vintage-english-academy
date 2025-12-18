import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import lailaChatRouter from './routes/laila-chat';
import bookTrialRouter from './routes/book-trial';
import evaluateTestRouter from './routes/evaluate-test';
import generateListeningAudioRouter from './routes/generate-listening-audio';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      ai_provider: process.env.AI_PROVIDER || 'gemini',
      has_ai_key: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY),
      has_elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      has_database: !!process.env.DATABASE_URL,
    }
  });
});

// API Routes
app.use('/api/laila-chat', lailaChatRouter);
app.use('/api/book-trial', bookTrialRouter);
app.use('/api/evaluate-test', evaluateTestRouter);
app.use('/api/generate-listening-audio', generateListeningAudioRouter);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 English Academy API Server                            ║
║                                                            ║
║   Server running at: http://localhost:${PORT}                ║
║   Health check:      http://localhost:${PORT}/api/health     ║
║                                                            ║
║   Endpoints:                                               ║
║   • POST /api/laila-chat         - AI Chatbot              ║
║   • GET  /api/book-trial         - Get available slots     ║
║   • POST /api/book-trial         - Book a trial class      ║
║   • POST /api/evaluate-test      - Evaluate test answers   ║
║   • POST /api/generate-listening-audio - Generate TTS      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
