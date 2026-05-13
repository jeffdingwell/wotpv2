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

  // API Route for Pexels Search
  app.get('/api/pexels/search', async (req, res) => {
    const query = req.query.query as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Try both standard and Vite-prefixed keys for flexibility, with a hardcoded fallback as requested.
    // We filter out placeholders like "YOUR_PEXELS_API_KEY"
    const candidates = [
      process.env.PEXELS_API_KEY,
      process.env.VITE_PEXELS_API_KEY,
      'HakLnJ24mzkfPjZtUj1Xp0yQa5YTitIGAV5IfkmgO6TtPMgX5lwBMfAc' // Hardcoded fallback provided by user
    ];
    
    const apiKey = candidates.find(key => key && key !== 'YOUR_PEXELS_API_KEY');

    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'Pexels API key not configured on server. Please ensure PEXELS_API_KEY is set in project secrets.' });
      }
      
      const client = createClient(apiKey);
      const response = await client.photos.search({ query, per_page: 8, page });
      
      if (!response) {
        throw new Error('Pexels API returned empty response');
      }
      
      res.json(response);
    } catch (error: any) {
      console.error('Pexels API error:', error);
      const message = error.message || 'Failed to fetch images from Pexels';
      res.status(500).json({ error: message });
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
