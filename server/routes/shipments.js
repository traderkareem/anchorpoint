/* ═══════════════════════════════════════════
   ANCHORPOINT — Shipments API (MongoDB)
   ═══════════════════════════════════════════ */

   const express = require('express');
   const router = express.Router();
   const Shipment = require('../models/Shipment');
   
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
   
   // POST /api/shipments — create a new shipment
   router.post('/', async (req, res) => {
     try {
       const errors = validateShipment(req.body);
       if (errors.length > 0) {
         return res.status(400).json({ error: 'Validation failed', details: errors });
       }
   
       const weight = parseFloat(req.body.packageWeight);
       const price = calculatePrice(weight, req.body.serviceType);
   
       // Generate unique tracking number
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
   
       console.log('✅ New shipment: ' + shipment.trackingNumber);
   
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
   
   // GET /api/shipments — list all (with optional filters)
   router.get('/', async (req, res) => {
     try {
       const filter = {};
   
       // Optional status filter: ?status=pending
       if (req.query.status && req.query.status !== 'all') {
         filter.status = req.query.status;
       }
   
       // Optional search by tracking number: ?search=AP26
       if (req.query.search) {
         filter.trackingNumber = { $regex: req.query.search.toUpperCase(), $options: 'i' };
       }
   
       const shipments = await Shipment.find(filter).sort({ createdAt: -1 }).limit(200);
   
       // Stats
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
   
   // GET /api/shipments/:tracking — look up by tracking number
   router.get('/:tracking', async (req, res) => {
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
   
   // PATCH /api/shipments/:tracking — update status + add tracking event
   router.patch('/:tracking', async (req, res) => {
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
        // Mark all previous "current" events as "done"
        shipment.events.forEach(function (evt) {
          if (evt.state === 'current') evt.state = 'done';
        });
      
        const now = new Date().toISOString();
      
        // Try to find an existing PENDING event with the same status
        // (this happens because buildTrackingEvents() pre-creates them)
        const existingPendingIndex = shipment.events.findIndex(function (e) {
          return e.state === 'pending' &&
                 e.status.toLowerCase() === newEvent.status.toLowerCase();
        });
      
        if (existingPendingIndex !== -1) {
          // UPDATE the existing pending event
          const event = shipment.events[existingPendingIndex];
          event.location = newEvent.location || '—';
          event.time = now;
          event.state = 'current';
      
          // If delivered → mark done
          if (newEvent.status.toLowerCase().indexOf('delivered') !== -1) {
            event.state = 'done';
            shipment.status = 'delivered';
            shipment.statusLabel = 'Delivered';
          } else {
            shipment.status = 'in_transit';
            shipment.statusLabel = newEvent.status;
          }
        } else {
          // Custom event — insert before the first pending
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
   router.delete('/:tracking', async (req, res) => {
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