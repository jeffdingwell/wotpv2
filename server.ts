import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from 'pexels';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const pexelsClient = createClient(process.env.PEXELS_API_KEY || '');

  app.use(express.json());

  // API Route for Pexels Search
  app.get('/api/pexels/search', async (req, res) => {
    const query = req.query.query as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      if (!process.env.PEXELS_API_KEY) {
        return res.status(500).json({ error: 'Pexels API key not configured' });
      }
      
      const response = await pexelsClient.photos.search({ query, per_page: 8, page });
      res.json(response);
    } catch (error) {
      console.error('Pexels API error:', error);
      res.status(500).json({ error: 'Failed to fetch images from Pexels' });
    }
  });

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
