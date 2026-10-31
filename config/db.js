const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloth_shop';

  // Production-grade MongoDB connection options
  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
  };

  // Setup connection event listeners once
  if (!mongoose.connection.listenerCount('disconnected')) {
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected from server');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected to server');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });
  }

  try {
    const conn = await mongoose.connect(uri, mongooseOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Could not connect to MongoDB at ${uri}: ${error.message}`);

    // In development mode, fallback to MongoMemoryServer for instant zero-friction local testing
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('🔄 Initializing in-memory MongoDB fallback for local development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri, mongooseOptions);
        console.log(`✅ In-Memory MongoDB Connected at: ${memoryUri}`);
        console.log('📌 NOTE: To use persistent MongoDB Atlas, set MONGODB_URI in backend/.env');
        return conn;
      } catch (memError) {
        console.error('❌ In-Memory MongoDB also failed:', memError.message);
        throw memError;
      }
    } else {
      throw error;
    }
  }
};

module.exports = connectDB;
