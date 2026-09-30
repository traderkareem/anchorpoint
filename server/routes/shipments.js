/* ═══════════════════════════════════════════
   ANCHORPOINT — Shipments API (MongoDB)
   ═══════════════════════════════════════════ */

   const express = require('express');
   const router = express.Router();
   const Shipment = require('../models/Shipment');
   const authMiddleware = require('./auth');
   
   // ═══ HELPERS ═══
   function generateTrackingNumber() {
     const year = new Date().getFullYear().toString().slice(-2);
     const random = Math.floor(100000 + Math.random() * 900000);
     return 'AP' + year + random + 'NG';
   }
   
   function validateShipment(body) {
     const errors = [];
     const required = [
       'senderName', 'senderEmail', 'senderPhone',
       'senderCountry', 'senderCity', 'senderAddress',
       'receiverName', 'receiverEmail', 'receiverPhone',
       'receiverCountry', 'receiverCity', 'receiverAddress',
       'packageWeight', 'packageLength', 'packageWidth', 'packageHeight',
       'packageDescription', 'serviceType'
     ];
   
     required.forEach(function (field) {
       if (!body[field] || String(body[field]).trim() === '') {
         errors.push('Missing required field: ' + field);
       }
     });
   
     if (body.senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.senderEmail)) {
       errors.push('Invalid sender email');
     }
     if (body.receiverEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.receiverEmail)) {
       errors.push('Invalid receiver email');
     }
   
     const weight = parseFloat(body.packageWeight);
     if (isNaN(weight) || weight <= 0) {
       errors.push('Package weight must be a positive number');
     }
   
     return errors;
   }
   
   function calculatePrice(weight, serviceType) {
     const rates = { 'same-day': 1.0, 'standard': 1.5, 'express': 2.5 };
     const rate = rates[serviceType] || 1.0;
     const baseFee = 15;
     return +(baseFee + weight * 4 * rate).toFixed(2);
   }
   
   function buildTrackingEvents() {
     const now = new Date().toISOString();
     return [
       { status: 'Shipment created',  location: 'AnchorPoint HQ', time: now,       state: 'done' },
       { status: 'Awaiting pickup',   location: '—',              time: 'Pending', state: 'current' },
       { status: 'Picked up',         location: '—',              time: 'Pending', state: 'pending' },
       { status: 'In transit',        location: '—',              time: 'Pending', state: 'pending' },
       { status: 'Out for delivery',  location: '—',              time: 'Pending', state: 'pending' },
       { status: 'Delivered',         location: '—',              time: 'Pending', state: 'pending' }
     ];
   }
   
   // ═══ ROUTES ═══
   
   // ★ This MUST come before /:tracking, otherwise "user" would be treated as a tracking number
   
   // GET /api/shipments/user/mine — logged-in user's shipments
   router.get('/user/mine', authMiddleware.requireAuth, async function (req, res) {
     try {
       const shipments = await Shipment
         .find({ userId: req.userId })
         .sort({ createdAt: -1 })
         .limit(100);
   
       res.json({ count: shipments.length, shipments: shipments });
   
     } catch (err) {
       console.error('My shipments error:', err);
       res.status(500).json({ error: 'Failed to fetch shipments', details: err.message });
     }
   });
   
   // POST /api/shipments — create (auth optional)
   router.post('/', authMiddleware.optionalAuth, async function (req, res) {
     try {
       const errors = validateShipment(req.body);
       if (errors.length > 0) {
         return res.status(400).json({ error: 'Validation failed', details: errors });
       }
   
       const weight = parseFloat(req.body.packageWeight);
       const price = calculatePrice(weight, req.body.serviceType);
   
       let trackingNumber;
       let exists = true;
       while (exists) {
         trackingNumber = generateTrackingNumber();
         exists = await Shipment.exists({ trackingNumber: trackingNumber });
       }
   
       const shipment = await Shipment.create({
         trackingNumber: trackingNumber,
         status: 'pending',
         statusLabel: 'Pending Pickup',
         userId: req.userId || null,
         sender: {
           name:    req.body.senderName,
           email:   req.body.senderEmail,
           phone:   req.body.senderPhone,
           country: req.body.senderCountry,
           city:    req.body.senderCity,
           address: req.body.senderAddress
         },
         receiver: {
           name:    req.body.receiverName,
           email:   req.body.receiverEmail,
           phone:   req.body.receiverPhone,
           country: req.body.receiverCountry,
           city:    req.body.receiverCity,
           address: req.body.receiverAddress
         },
         package: {
           weight:        weight,
           length:        parseFloat(req.body.packageLength),
           width:         parseFloat(req.body.packageWidth),
           height:        parseFloat(req.body.packageHeight),
           description:   req.body.packageDescription,
           declaredValue: parseFloat(req.body.packageValue) || 0
         },
         service:  req.body.serviceType,
         price:    price,
         currency: 'USD',
         events:   buildTrackingEvents()
       });
   
       console.log('✅ New shipment: ' + shipment.trackingNumber + (req.userId ? ' (user ' + req.userId + ')' : ' (guest)'));
   
       res.status(201).json({
         success: true,
         trackingNumber: shipment.trackingNumber,
         estimatedPrice: '$' + price.toFixed(2),
         shipment: shipment
       });
   
     } catch (err) {
       console.error('Create shipment error:', err);
       res.status(500).json({ error: 'Failed to create shipment', details: err.message });
     }
   });
   
   // GET /api/shipments — list all (admin/debug)
   router.get('/', async function (req, res) {
     try {
       const filter = {};
   
       if (req.query.status && req.query.status !== 'all') {
         filter.status = req.query.status;
       }
       if (req.query.search) {
         filter.trackingNumber = { $regex: req.query.search.toUpperCase(), $options: 'i' };
       }
   
       const shipments = await Shipment.find(filter).sort({ createdAt: -1 }).limit(200);
   
       const stats = {
         total:      await Shipment.countDocuments(),
         pending:    await Shipment.countDocuments({ status: 'pending' }),
         inTransit:  await Shipment.countDocuments({ status: 'in_transit' }),
         delivered:  await Shipment.countDocuments({ status: 'delivered' })
       };
   
       res.json({ count: shipments.length, stats: stats, shipments: shipments });
   
     } catch (err) {
       console.error('List shipments error:', err);
       res.status(500).json({ error: 'Failed to fetch shipments', details: err.message });
     }
   });
   
   // GET /api/shipments/:tracking — lookup by tracking number
   router.get('/:tracking', async function (req, res) {
     try {
       const tracking = req.params.tracking.toUpperCase();
       const shipment = await Shipment.findOne({ trackingNumber: tracking });
   
       if (!shipment) {
         return res.status(404).json({ error: 'Shipment not found', trackingNumber: tracking });
       }
   
       res.json(shipment);
   
     } catch (err) {
       console.error('Lookup error:', err);
       res.status(500).json({ error: 'Lookup failed', details: err.message });
     }
   });
   
   // PATCH /api/shipments/:tracking — update status + add event
   router.patch('/:tracking', async function (req, res) {
     try {
       const tracking = req.params.tracking.toUpperCase();
       const shipment = await Shipment.findOne({ trackingNumber: tracking });
   
       if (!shipment) {
         return res.status(404).json({ error: 'Shipment not found' });
       }
   
       const status = req.body.status;
       const statusLabel = req.body.statusLabel;
       const newEvent = req.body.newEvent;
   
       if (status) shipment.status = status;
       if (statusLabel) shipment.statusLabel = statusLabel;
   
       if (newEvent && newEvent.status) {
         shipment.events.forEach(function (evt) {
           if (evt.state === 'current') evt.state = 'done';
         });
   
         const now = new Date().toISOString();
   
         const existingPendingIndex = shipment.events.findIndex(function (e) {
           return e.state === 'pending' &&
                  e.status.toLowerCase() === newEvent.status.toLowerCase();
         });
   
         if (existingPendingIndex !== -1) {
           const event = shipment.events[existingPendingIndex];
           event.location = newEvent.location || '—';
           event.time = now;
           event.state = 'current';
   
           if (newEvent.status.toLowerCase().indexOf('delivered') !== -1) {
             event.state = 'done';
             shipment.status = 'delivered';
             shipment.statusLabel = 'Delivered';
           } else {
             shipment.status = 'in_transit';
             shipment.statusLabel = newEvent.status;
           }
         } else {
           const event = {
             status: newEvent.status,
             location: newEvent.location || '—',
             time: now,
             state: 'current'
           };
   
           const insertIndex = shipment.events.findIndex(function (e) {
             return e.state === 'pending';
           });
   
           if (insertIndex === -1) {
             shipment.events.push(event);
           } else {
             shipment.events.splice(insertIndex, 0, event);
           }
   
           if (newEvent.status.toLowerCase().indexOf('delivered') !== -1) {
             event.state = 'done';
             shipment.status = 'delivered';
             shipment.statusLabel = 'Delivered';
           } else {
             shipment.status = 'in_transit';
             shipment.statusLabel = newEvent.status;
           }
         }
       }
   
       await shipment.save();
   
       console.log('✏️ Updated shipment: ' + tracking);
       res.json({ success: true, shipment: shipment });
   
     } catch (err) {
       console.error('Update shipment error:', err);
       res.status(500).json({ error: 'Update failed', details: err.message });
     }
   });
   
   // DELETE /api/shipments/:tracking
   router.delete('/:tracking', async function (req, res) {
     try {
       const tracking = req.params.tracking.toUpperCase();
       const result = await Shipment.findOneAndDelete({ trackingNumber: tracking });
   
       if (!result) {
         return res.status(404).json({ error: 'Shipment not found' });
       }
   
       console.log('🗑️ Deleted shipment: ' + tracking);
       res.json({ success: true, deleted: tracking });
   
     } catch (err) {
       console.error('Delete shipment error:', err);
       res.status(500).json({ error: 'Delete failed', details: err.message });
     }
   });
   
   module.exports = router;