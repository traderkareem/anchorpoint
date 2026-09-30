/* ═══════════════════════════════════════════
   ANCHORPOINT — Shipment Model (MongoDB)
   ═══════════════════════════════════════════ */

   const mongoose = require('mongoose');

   const eventSchema = new mongoose.Schema({
     status:   { type: String, required: true },
     location: { type: String, default: '—' },
     time:     { type: String, default: 'Pending' },
     state:    { type: String, enum: ['done', 'current', 'pending'], default: 'pending' }
   }, { _id: false });
   
   const shipmentSchema = new mongoose.Schema({
     trackingNumber: { type: String, required: true, unique: true, index: true },
     status:         { type: String, default: 'pending' },
     statusLabel:    { type: String, default: 'Pending Pickup' },
   
     userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       default: null,
       index: true
     },
   
     sender: {
       name:    { type: String, required: true },
       email:   { type: String, required: true },
       phone:   { type: String, required: true },
       country: { type: String, required: true },
       city:    { type: String, required: true },
       address: { type: String, required: true }
     },
   
     receiver: {
       name:    { type: String, required: true },
       email:   { type: String, required: true },
       phone:   { type: String, required: true },
       country: { type: String, required: true },
       city:    { type: String, required: true },
       address: { type: String, required: true }
     },
   
     package: {
       weight:        { type: Number, required: true },
       length:        { type: Number, required: true },
       width:         { type: Number, required: true },
       height:        { type: Number, required: true },
       description:   { type: String, required: true },
       declaredValue: { type: Number, default: 0 }
     },
   
     service:  { type: String, required: true },
     price:    { type: Number, required: true },
     currency: { type: String, default: 'USD' },
     events:   [eventSchema]
   }, { timestamps: true });
   
   module.exports = mongoose.model('Shipment', shipmentSchema);