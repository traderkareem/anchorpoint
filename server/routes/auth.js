/* ═══════════════════════════════════════════
   ANCHORPOINT — Authentication API
   ═══════════════════════════════════════════ */

   const express = require('express');
   const router = express.Router();
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');
   
   const JWT_SECRET = process.env.JWT_SECRET;
   const JWT_EXPIRES = '7d';

   // ═══ MIDDLEWARE: optional auth ═══
// If a valid JWT is present, sets req.userId.
// If not, continues anyway — no error.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
  } catch (err) {
    // Invalid token — ignore, continue as guest
  }
  next();
}
   
   // ═══ MIDDLEWARE: verify JWT ═══
   function requireAuth(req, res, next) {
     const header = req.headers.authorization || '';
     const token = header.startsWith('Bearer ') ? header.slice(7) : null;
   
     if (!token) {
       return res.status(401).json({ error: 'Not authenticated' });
     }
   
     try {
       const payload = jwt.verify(token, JWT_SECRET);
       req.userId = payload.id;
       next();
     } catch (err) {
       return res.status(401).json({ error: 'Invalid or expired token' });
     }
   }
   
   function requireAdmin(req, res, next) {
     requireAuth(req, res, function () {
       User.findById(req.userId).then(function (user) {
         if (!user) {
           return res.status(401).json({ error: 'User not found' });
         }
         if (user.role !== 'admin') {
           return res.status(403).json({ error: 'Admin access required' });
         }
         req.user = user;
         next();
       }).catch(function (err) {
         res.status(500).json({ error: 'Server error', details: err.message });
       });
     });
   }
   
   // ═══ POST /api/auth/signup ═══
   router.post('/signup', async function (req, res) {
     try {
       const name = (req.body.name || '').trim();
       const email = (req.body.email || '').trim().toLowerCase();
       const password = req.body.password || '';
       const phone = (req.body.phone || '').trim();
       const country = (req.body.country || '').trim();
   
       // Validate
       const errors = [];
       if (!name) errors.push('Name is required');
       if (!email) errors.push('Email is required');
       if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email');
       if (!password) errors.push('Password is required');
       if (password && password.length < 6) errors.push('Password must be at least 6 characters');
   
       if (errors.length) {
         return res.status(400).json({ error: 'Validation failed', details: errors });
       }
   
       // Check if email already exists
       const existing = await User.findOne({ email: email });
       if (existing) {
         return res.status(400).json({ error: 'Email already registered' });
       }
   
       // Hash and create
       const passwordHash = User.hashPassword(password);
   
       const user = await User.create({
         name: name,
         email: email,
         passwordHash: passwordHash,
         phone: phone,
         country: country,
         role: 'user'
       });
   
       // Sign JWT
       const token = jwt.sign(
         { id: user._id, email: user.email, role: user.role },
         JWT_SECRET,
         { expiresIn: JWT_EXPIRES }
       );
   
       console.log('✅ New user registered: ' + user.email);
   
       res.status(201).json({
         success: true,
         token: token,
         user: user.toSafeJSON()
       });
   
     } catch (err) {
       console.error('Signup error:', err);
       res.status(500).json({ error: 'Signup failed', details: err.message });
     }
   });
   
   // ═══ POST /api/auth/login ═══
   router.post('/login', async function (req, res) {
     try {
       const email = (req.body.email || '').trim().toLowerCase();
       const password = req.body.password || '';
   
       if (!email || !password) {
         return res.status(400).json({ error: 'Email and password are required' });
       }
   
       const user = await User.findOne({ email: email });
       if (!user) {
         return res.status(401).json({ error: 'Invalid email or password' });
       }
   
       const ok = user.verifyPassword(password);
       if (!ok) {
         return res.status(401).json({ error: 'Invalid email or password' });
       }
   
       const token = jwt.sign(
         { id: user._id, email: user.email, role: user.role },
         JWT_SECRET,
         { expiresIn: JWT_EXPIRES }
       );
   
       console.log('✅ User logged in: ' + user.email);
   
       res.json({
         success: true,
         token: token,
         user: user.toSafeJSON()
       });
   
     } catch (err) {
       console.error('Login error:', err);
       res.status(500).json({ error: 'Login failed', details: err.message });
     }
   });
   
   // ═══ GET /api/auth/me — current user ═══
   router.get('/me', requireAuth, async function (req, res) {
     try {
       const user = await User.findById(req.userId);
       if (!user) {
         return res.status(404).json({ error: 'User not found' });
       }
       res.json({ user: user.toSafeJSON() });
     } catch (err) {
       res.status(500).json({ error: 'Server error', details: err.message });
     }
   });
   
   module.exports = router;
   module.exports.requireAuth = requireAuth;
   module.exports.requireAdmin = requireAdmin;
   module.exports.optionalAuth = optionalAuth;