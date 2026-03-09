// // const express = require('express');
// // const mongoose = require('mongoose');
// // const cors = require('cors');
// // const bcrypt = require('bcryptjs');
// // require('dotenv').config();

// import express from "express"
// import cors from "cors"
// import dotenv from "dotenv"
// dotenv.config()
// import appRoute from "./routes/app-routes.js"
// const app = express();

// // ========== MIDDLEWARE ========== //
// app.use(cors({
//     origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080','https://nishat-beverages-kfyk.vercel.app','https://nishat-beverages.vercel.app'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ========== DATABASE CONNECTION ========== //
// const MONGODB_URI = process.env.MONGODB_URI;
// const USE_LOCAL_FALLBACK = false; // Set to false if you only want Atlas

// const connectDB = async (retryCount = 0) => {
//   try {
//     console.log('\n' + '='.repeat(60));
//     console.log('🔌 DATABASE CONNECTION ATTEMPT');
//     console.log('='.repeat(60));

//     // Connection options to handle DNS and network issues
//     const options = {
//       serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
//       socketTimeoutMS: 45000,
//       family: 4, // Force IPv4
//       retryWrites: true,
//       retryReads: true,
//       maxPoolSize: 10,
//       minPoolSize: 2,
//     };

//     console.log(`📂 Attempting to connect to database: nishatplant`);
//     console.log(`🌐 Connection type: MongoDB Atlas`);
//     console.log(`🔄 Retry attempt: ${retryCount}`);

//     await mongoose.connect(MONGODB_URI, options);

//     console.log('\n✅ MongoDB Atlas Connected Successfully!');
//     console.log(`📁 Database Name: ${mongoose.connection.db.databaseName}`);
//     console.log(`📊 Host: ${mongoose.connection.host}`);
//     console.log(`🔄 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

//     // Create indexes for better performance
//     await createIndexes();

//     return true;

//   } catch (error) {
//     console.error('\n❌ MongoDB Atlas Connection Failed:', error.message);

//     if (error.name === 'MongooseServerSelectionError') {
//       console.error('⚠️  Server Selection Error - This usually means:');
//       console.error('   1. Your IP is not whitelisted in MongoDB Atlas');
//       console.error('   2. Network/DNS issues');
//       console.error('   3. Atlas cluster is not accessible');
//     }

//     if (error.code === 'ECONNREFUSED') {
//       console.error('⚠️  Connection refused - DNS resolution failed');
//       console.error('   This is often a network/DNS issue');
//     }

//     // Try fallback to local MongoDB if enabled
//     if (USE_LOCAL_FALLBACK && retryCount === 0) {
//       console.log('\n🔄 Attempting to connect to local MongoDB as fallback...');
//       try {
//         const localUri = 'mongodb://localhost:27017/nishatplant';
//         await mongoose.connect(localUri, {
//           serverSelectionTimeoutMS: 5000,
//           family: 4
//         });

//         console.log('\n✅ Local MongoDB Connected Successfully!');
//         console.log(`📁 Database Name: ${mongoose.connection.db.databaseName}`);
//         console.log(`📍 Host: localhost`);

//         // Create indexes for better performance
//         await createIndexes();

//         return true;
//       } catch (localError) {
//         console.error('❌ Local MongoDB connection also failed:', localError.message);
//         console.log('\n💡 FINAL TROUBLESHOOTING:');
//         console.log('1. Make sure MongoDB is installed locally');
//         console.log('2. Run: mongod (in a separate terminal)');
//         console.log('3. Check if MongoDB service is running');
//         console.log('4. Try connecting with MongoDB Compass first');

//         if (retryCount < 2) {
//           console.log(`\n🔄 Retrying connection in 5 seconds... (Attempt ${retryCount + 2}/3)`);
//           setTimeout(() => connectDB(retryCount + 1), 5000);
//         } else {
//           console.log('\n❌ Failed to connect after 3 attempts. Please fix the issues above.');
//           process.exit(1);
//         }
//       }
//     } else {
//       if (retryCount < 2) {
//         console.log(`\n🔄 Retrying connection in 5 seconds... (Attempt ${retryCount + 2}/3)`);
//         setTimeout(() => connectDB(retryCount + 1), 5000);
//       } else {
//         console.log('\n❌ Failed to connect after 3 attempts. Please check your MongoDB Atlas settings.');
//         process.exit(1);
//       }
//     }
//   }
// };

// // Helper function to create indexes
// const createIndexes = async () => {
//   try {
//     console.log('\n📊 Creating database indexes...');

//     // User indexes
//     await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
//     await mongoose.connection.collection('users').createIndex({ phone: 1 });

//     // Customer indexes
//     await mongoose.connection.collection('customers').createIndex({ mobile: 1 }, { unique: true });
//     await mongoose.connection.collection('customers').createIndex({ area: 1 });
//     await mongoose.connection.collection('customers').createIndex({ salesmanId: 1 });
//     await mongoose.connection.collection('customers').createIndex({ name: 'text', mobile: 'text' });

//     // Salesman indexes
//     await mongoose.connection.collection('salesmen').createIndex({ mobile: 1 }, { unique: true });
//     await mongoose.connection.collection('salesmen').createIndex({ name: 1 });

//     // Area indexes
//     await mongoose.connection.collection('areaassignments').createIndex({ area: 1 }, { unique: true });
//     await mongoose.connection.collection('areaassignments').createIndex({ salesmanId: 1 });

//     console.log('✅ Database indexes created successfully');
//   } catch (error) {
//     console.log('⚠️  Index creation warning:', error.message);
//     // Don't fail if indexes already exist
//   }
// };

// // ========== SCHEMAS ========== //

// // ========== ROOT ROUTE ========== //
// app.get('/', (req, res) => {
//   const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
//   const dbName = mongoose.connection.db?.databaseName || 'Not connected';

//   res.json({
//     message: 'Nishat Beverages Admin API',
//     database: {
//       status: dbStatus,
//       name: dbName,
//       host: mongoose.connection.host || 'N/A'
//     },
//     endpoints: {
//       auth: {
//         signup: 'POST /api/auth/signup',
//         login: 'POST /api/auth/login',
//         users: 'GET /api/auth/users',
//         createAdmin: 'POST /api/auth/create-admin'
//       },
//       customers: {
//         getAll: 'GET /api/customers',
//         getOne: 'GET /api/customers/:id',
//         create: 'POST /api/customers',
//         update: 'PUT /api/customers/:id',
//         delete: 'DELETE /api/customers/:id',
//         stats: 'GET /api/customers/stats/summary',
//         areas: 'GET /api/customers/areas/list',
//         search: 'GET /api/customers/search/:query'
//       },
//       salesmen: {
//         getAll: 'GET /api/salesmen',
//         getOne: 'GET /api/salesmen/:id',
//         create: 'POST /api/salesmen',
//         update: 'PUT /api/salesmen/:id',
//         delete: 'DELETE /api/salesmen/:id',
//         stats: 'GET /api/salesmen/stats/summary'
//       },
//       areas: {
//         getAll: 'GET /api/area-assignments',
//         getOne: 'GET /api/area-assignments/:id',
//         create: 'POST /api/area-assignments',
//         update: 'PUT /api/area-assignments/:id',
//         delete: 'DELETE /api/area-assignments/:id',
//         stats: 'GET /api/area-assignments/stats/summary'
//       },
//       health: 'GET /api/health'
//     }
//   });
// });

// app.use("/api",appRoute)

// // ========== ERROR HANDLING MIDDLEWARE ========== //
// app.use((err, req, res, next) => {
//   console.error('Server error:', err.stack);
//   res.status(500).json({
//     success: false,
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // ========== 404 HANDLER ========== //
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // ========== START SERVER ========== //
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log('\n' + '='.repeat(60));
//   console.log('🚀 NISHAT BEVERAGES RO PLANT - ADMIN SERVER');
//   console.log('='.repeat(60));
//   console.log(`📡 Server URL: http://localhost:${PORT}`);
//   console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
//   console.log('='.repeat(60));
//   console.log('\n🔐 AUTHENTICATION ENDPOINTS:');
//   console.log(`   POST  http://localhost:${PORT}/api/auth/signup`);
//   console.log(`   POST  http://localhost:${PORT}/api/auth/login`);
//   console.log(`   POST  http://localhost:${PORT}/api/auth/create-admin (optional)`);
//   console.log(`   GET   http://localhost:${PORT}/api/auth/users`);
//   console.log('\n👥 CUSTOMER ENDPOINTS:');
//   console.log(`   GET   http://localhost:${PORT}/api/customers`);
//   console.log(`   POST  http://localhost:${PORT}/api/customers`);
//   console.log(`   GET   http://localhost:${PORT}/api/customers/areas/list`);
//   console.log('\n👤 SALESMAN ENDPOINTS:');
//   console.log(`   GET   http://localhost:${PORT}/api/salesmen`);
//   console.log(`   POST  http://localhost:${PORT}/api/salesmen`);
//   console.log(`   GET   http://localhost:${PORT}/api/salesmen/stats/summary`);
//   console.log('\n📍 AREA ASSIGNMENT ENDPOINTS:');
//   console.log(`   GET    http://localhost:${PORT}/api/area-assignments`);
//   console.log(`   POST   http://localhost:${PORT}/api/area-assignments`);
//   console.log(`   GET    http://localhost:${PORT}/api/area-assignments/:id`);
//   console.log(`   PUT    http://localhost:${PORT}/api/area-assignments/:id`);
//   console.log(`   DELETE http://localhost:${PORT}/api/area-assignments/:id`);
//   console.log(`   GET    http://localhost:${PORT}/api/area-assignments/stats/summary`);
//   console.log('='.repeat(60));

//   // Connect to database
//   connectDB().then(() => {
//     console.log('\n✅ Server is fully ready!');
//     console.log('💡 Tip: Use email or phone number to login');
//     console.log('='.repeat(60) + '\n');
//   });
// });

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import appRoute from "./routes/app-routes.js";

// Import the database connection module
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// ========== MIDDLEWARE ========== //
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080",
      "https://nishat-beverages-kfyk.vercel.app",
      "https://nishat-beverages.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== INITIALIZE DATABASE ========== //
// Connect to DB immediately for Serverless functions
connectDB();

// ========== ROUTES ========== //
app.get("/", (req, res) => {
  res.json({
    message: "Nishat Beverages Admin API is running!",
    database: {
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      name: mongoose.connection.db?.databaseName || "Not connected",
    },
  });
});

app.use("/api", appRoute);

// ========== ERROR HANDLING ========== //
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ========== START SERVER ========== //
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`📡 Server URL: http://localhost:${PORT}`);
});

// Export for Vercel Serverless Functions
export default app;
