import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const USE_LOCAL_FALLBACK = false; 

// Global variable to cache the connection in Vercel's serverless environment
let isConnected = false; 

export const connectDB = async (retryCount = 0) => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB database connection');
    return;
  }

  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔌 DATABASE CONNECTION ATTEMPT');
    console.log('='.repeat(60));
    
    const options = {
      serverSelectionTimeoutMS: 10000, 
      socketTimeoutMS: 45000,
      family: 4, 
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    console.log(`📂 Attempting to connect to database: nishatplant`);
    console.log(`🌐 Connection type: MongoDB Atlas`);

    const db = await mongoose.connect(MONGODB_URI, options);
    isConnected = db.connections[0].readyState === 1;
    
    console.log('\n✅ MongoDB Atlas Connected Successfully!');
    console.log(`📁 Database Name: ${mongoose.connection.db.databaseName}`);
    console.log(`📊 Host: ${mongoose.connection.host}`);
    
    await createIndexes();
    return true;

  } catch (error) {
    console.error('\n❌ MongoDB Atlas Connection Failed:', error.message);
    
    // Fallback logic for local development
    if (USE_LOCAL_FALLBACK && retryCount === 0) {
      console.log('\n🔄 Attempting to connect to local MongoDB as fallback...');
      try {
        const localUri = 'mongodb://localhost:27017/nishatplant';
        const db = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000, family: 4 });
        isConnected = db.connections[0].readyState === 1;
        
        console.log('\n✅ Local MongoDB Connected Successfully!');
        await createIndexes();
        return true;
      } catch (localError) {
        console.error('❌ Local MongoDB connection also failed:', localError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

// Helper function to create indexes
const createIndexes = async () => {
  try {
    console.log('\n📊 Creating database indexes...');
    
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ phone: 1 });
    await mongoose.connection.collection('customers').createIndex({ mobile: 1 }, { unique: true });
    await mongoose.connection.collection('customers').createIndex({ area: 1 });
    await mongoose.connection.collection('customers').createIndex({ salesmanId: 1 });
    await mongoose.connection.collection('customers').createIndex({ name: 'text', mobile: 'text' });
    await mongoose.connection.collection('salesmen').createIndex({ mobile: 1 }, { unique: true });
    await mongoose.connection.collection('salesmen').createIndex({ name: 1 });
    await mongoose.connection.collection('areaassignments').createIndex({ area: 1 }, { unique: true });
    await mongoose.connection.collection('areaassignments').createIndex({ salesmanId: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.log('⚠️  Index creation warning:', error.message);
  }
};