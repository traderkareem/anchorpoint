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
     return `AP${year}${random}NG`;
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
   
     required.forEach(field => {
       if (!body[field] || String(body[field]).trim() === '') {
         errors.push(`Missing required field: ${field}`);
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
   
   router.post('/', async (req, res) => {
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
         exists = await Shipment.exists({ trackingNumber });
       }
   
       const shipment = await Shipment.create({
         trackingNumber,
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
           weight,
           length:        parseFloat(req.body.packageLength),
           width:         parseFloat(req.body.packageWidth),
           height:        parseFloat(req.body.packageHeight),
           description:   req.body.packageDescription,
           declaredValue: parseFloat(req.body.packageValue) || 0
         },
         service:  req.body.serviceType,
         price,
         currency: 'USD',
         events:   buildTrackingEvents()
       });
   
       console.log(`✅ New shipment: ${shipment.trackingNumber}`);
   
       res.status(201).json({
         success: true,
         trackingNumber: shipment.trackingNumber,
         estimatedPrice: `$${price.toFixed(2)}`,
         shipment
       });
     } catch (err) {
       console.error('Create shipment error:', err);
       res.status(500).json({ error: 'Failed to create shipment', details: err.message });
     }
   });
   
   router.get('/', async (req, res) => {
     try {
       const shipments = await Shipment.find().sort({ createdAt: -1 }).limit(100);
       res.json({ count: shipments.length, shipments });
     } catch (err) {
       res.status(500).json({ error: 'Failed to fetch shipments', details: err.message });
     }
   });
   
   router.get('/:tracking', async (req, res) => {
     try {
       const tracking = req.params.tracking.toUpperCase();
       const shipment = await Shipment.findOne({ trackingNumber: tracking });
   
       if (!shipment) {
         return res.status(404).json({ error: 'Shipment not found', trackingNumber: tracking });
       }
   
       res.json(shipment);
     } catch (err) {
       res.status(500).json({ error: 'Lookup failed', details: err.message });
     }
   });
   
   module.exports = router;