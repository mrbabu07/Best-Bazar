/**
 * Custom Next.js Server with Socket.IO
 * 
 * This server enables WebSocket support for real-time features:
 * - Real-time order notifications for admins
 * - Live order status tracking for customers
 * - Stock updates
 * - Admin notifications
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3002', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO after server starts
  server.listen(port, () => {
    console.log(`\n> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
    
    // Import and initialize Socket.IO
    try {
      const { initSocketServer } = require('./.next/server/chunks/socket-server.js');
      initSocketServer(server);
      console.log('> WebSocket server ready on /api/socket');
    } catch (err) {
      console.warn('> Socket.IO not initialized (will initialize after build):', err.message);
    }
  });
});
