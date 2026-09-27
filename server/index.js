/* ═══════════════════════════════════════════
   ANCHORPOINT — Backend Server
   Node.js + Express
   ═══════════════════════════════════════════ */

   const express = require('express');
   const cors = require('cors');
   const path = require('path');
   
   const app = express();
   const PORT = process.env.PORT || 4000;
   
   // ═══ MIDDLEWARE ═══
   app.use(cors());
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   
   // Serve static frontend from /public
   app.use(express.static(path.join(__dirname, '..', 'public')));
   
   // Request logger (simple)
   app.use((req, res, next) => {
     console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
     next();
   });
   
   // ═══ IN-MEMORY STORE (Step 6) ═══
   // This will be replaced with MongoDB in Step 7
   const shipments = [];
   
   // ═══ ROUTES ═══
   const shipmentsRouter = require('./routes/shipments');
   
   // Health check
   app.get('/api/health', (req, res) => {
     res.json({
       status: 'ok',
       service: 'AnchorPoint API',
       time: new Date().toISOString(),
       shipments: shipments.length
     });
   });
   
   // Mount shipments routes
   app.use('/api/shipments', shipmentsRouter);
   
   // Fallback: serve index.html for unknown routes (SPA-style)
   app.get('*', (req, res, next) => {
     if (req.url.startsWith('/api/')) return next();
     res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
   });
   
   // 404 for API
   app.use('/api/*', (req, res) => {
     res.status(404).json({ error: 'API route not found' });
   });
   
   // Error handler
   app.use((err, req, res, next) => {
     console.error('Server error:', err);
     res.status(500).json({ error: 'Internal server error' });
   });
   
   // ═══ START ═══
   app.listen(PORT, () => {
     console.log('');
     console.log('═══════════════════════════════════════');
     console.log('  🚀 AnchorPoint API running');
     console.log(`  📡 http://localhost:${PORT}`);
     console.log(`  🩺 http://localhost:${PORT}/api/health`);
     console.log('═══════════════════════════════════════');
     console.log('');
   });
   
   module.exports = { app, shipments };