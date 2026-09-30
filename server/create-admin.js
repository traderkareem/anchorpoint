/* ═══════════════════════════════════════════
   ANCHORPOINT — One-time script to create admin user
   Run once with: node server/create-admin.js
   ═══════════════════════════════════════════ */

   require('dotenv').config();
   const mongoose = require('mongoose');
   const readline = require('readline');
   const User = require('./models/User');
   
   const MONGODB_URI = process.env.MONGODB_URI;
   
   if (!MONGODB_URI) {
     console.error('❌ MONGODB_URI missing in .env');
     process.exit(1);
   }
   
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout
   });
   
   function ask(question) {
     return new Promise(function (resolve) {
       rl.question(question, resolve);
     });
   }
   
   async function main() {
     console.log('');
     console.log('═══════════════════════════════════════');
     console.log('  🔐 Create Admin User');
     console.log('═══════════════════════════════════════');
     console.log('');
   
     try {
       await mongoose.connect(MONGODB_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true
       });
       console.log('✅ MongoDB connected');
       console.log('');
   
       const name = await ask('Admin name: ');
       const email = (await ask('Admin email: ')).toLowerCase().trim();
       const password = await ask('Admin password (min 6 chars): ');
   
       if (!name || !email || !password) {
         console.error('❌ All fields are required');
         process.exit(1);
       }
   
       if (password.length < 6) {
         console.error('❌ Password must be at least 6 characters');
         process.exit(1);
       }
   
       const existing = await User.findOne({ email: email });
       if (existing) {
         console.error('❌ User with this email already exists');
         console.log('   Updating role to admin...');
         existing.role = 'admin';
         await existing.save();
         console.log('✅ ' + email + ' is now an admin');
         process.exit(0);
       }
   
       const passwordHash = User.hashPassword(password);
   
       const user = await User.create({
         name: name,
         email: email,
         passwordHash: passwordHash,
         role: 'admin'
       });
   
       console.log('');
       console.log('═══════════════════════════════════════');
       console.log('  ✅ Admin user created');
       console.log('═══════════════════════════════════════');
       console.log('  Name:  ' + user.name);
       console.log('  Email: ' + user.email);
       console.log('  Role:  ' + user.role);
       console.log('═══════════════════════════════════════');
       console.log('');
   
       process.exit(0);
   
     } catch (err) {
       console.error('❌ Error:', err.message);
       process.exit(1);
     }
   }
   
   main();