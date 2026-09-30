/* ═══════════════════════════════════════════
   ANCHORPOINT — Backend Server (with MongoDB)
   ═══════════════════════════════════════════ */

   require('dotenv').config();
   const express = require('express');
   const cors = require('cors');
   const mongoose = require('mongoose');
   const path = require('path');
   
   const app = express();
   const PORT = process.env.PORT || 4000;
   
   // ═══ MIDDLEWARE ═══
   app.use(cors());
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(express.static(path.join(__dirname, '..', 'public')));
   
   // Request logger
   app.use((req, res, next) => {
     console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
     next();
   });
   
   // ═══ MONGODB CONNECTION ═══
   const MONGODB_URI = process.env.MONGODB_URI;
   
   if (!MONGODB_URI) {
     console.error('❌ MONGODB_URI missing in .env');
     process.exit(1);
   }
   
   mongoose.connect(MONGODB_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true
   })
   .then(() => console.log('✅ MongoDB connected'))
   .catch(err => {
     console.error('❌ MongoDB connection error:', err.message);
     process.exit(1);
   });
   
   // ═══ ROUTES ═══
   const shipmentsRouter = require('./routes/shipments');
   
   app.get('/api/health', (req, res) => {
     const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
     res.json({
       status: 'ok',
       service: 'AnchorPoint API',
       time: new Date().toISOString(),
       database: states[mongoose.connection.readyState] || 'unknown'
     });
   });
   
   app.use('/api/shipments', shipmentsRouter);

   // ═══ AUTH ROUTES ═══
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);
   
   // Fallback for frontend
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
   
   module.exports = app;