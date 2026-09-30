/* ═══════════════════════════════════════════
   ANCHORPOINT — User Model (MongoDB)
   ═══════════════════════════════════════════ */

   const mongoose = require('mongoose');
   const bcrypt = require('bcryptjs');
   
   const userSchema = new mongoose.Schema({
     name: {
       type: String,
       required: true,
       trim: true
     },
     email: {
       type: String,
       required: true,
       unique: true,
       lowercase: true,
       trim: true,
       index: true
     },
     passwordHash: {
       type: String,
       required: true
     },
     role: {
       type: String,
       enum: ['user', 'admin'],
       default: 'user'
     },
     phone: {
       type: String,
       default: ''
     },
     country: {
       type: String,
       default: ''
     }
   }, {
     timestamps: true
   });
   
   // ═══ Instance method: verify a password ═══
   userSchema.methods.verifyPassword = function (plainPassword) {
     return bcrypt.compareSync(plainPassword, this.passwordHash);
   };
   
   // ═══ Static method: hash a password ═══
   userSchema.statics.hashPassword = function (plainPassword) {
     return bcrypt.hashSync(plainPassword, 10);
   };
   
   // ═══ Method: return safe user object (no password) ═══
   userSchema.methods.toSafeJSON = function () {
     return {
       id: this._id,
       name: this.name,
       email: this.email,
       role: this.role,
       phone: this.phone,
       country: this.country,
       createdAt: this.createdAt
     };
   };
   
   module.exports = mongoose.model('User', userSchema);