import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from 'pexels';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Router
  const apiRouter = express.Router();

  // Logging and Content-Type header for all API routes
  apiRouter.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.originalUrl || req.url}`);
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // API Route for Pexels Search
  apiRouter.get('/pexels/search', async (req, res) => {
    const query = req.query.query as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const candidates = [
      process.env.PEXELS_API_KEY,
      process.env.VITE_PEXELS_API_KEY,
      'HakLnJ24mzkfPjZtUj1Xp0yQa5YTitIGAV5IfkmgO6TtPMgX5lwBMfAc'
    ];
    
    const apiKey = candidates.find(key => key && key !== 'YOUR_PEXELS_API_KEY');

    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'Pexels API key not configured on server' });
      }
      
      const client = createClient(apiKey);
      const response = await client.photos.search({ query, per_page: 8, page });
      
      if (!response) {
        throw new Error('Pexels API returned empty response');
      }
      
      res.json(response);
    } catch (error: any) {
      console.error('Pexels API error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch images from Pexels' });
    }
  });

  // Catch-all 404 for API routes to prevent falling through to the SPA fallback (index.html)
  apiRouter.use((req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.originalUrl || req.url}` });
  });

  // Mount the API router
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
