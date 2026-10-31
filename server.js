const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const validateEnv = require('./config/envValidator');
const { autoSeedInitialData } = require('./seeds/seedRunner');

// Run pre-flight environment checks
validateEnv();

const PORT = process.env.PORT || 5000;
let server;

// Connect Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed initial admin and demo fashion catalogue if empty
    await autoSeedInitialData();

    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 AURA ATELIER E-COMMERCE BACKEND RUNNING`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🛡️  Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown Handler for Containers & Process Managers (Docker, PM2, Kubernetes)
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      if (server) {
        server.close(async () => {
          console.log('🔒 Closed remaining HTTP connections.');
          try {
            await mongoose.connection.close(false);
            console.log('💾 Closed MongoDB database connection.');
            process.exit(0);
          } catch (dbErr) {
            console.error('❌ Error closing MongoDB connection:', dbErr);
            process.exit(1);
          }
        });

        // Force shutdown after 10s timeout if connections hang
        setTimeout(() => {
          console.error('⚠️ Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    // Listen for process termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`💥 Unhandled Promise Rejection: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('unhandledRejection');
      }
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      console.error(`💥 Uncaught Exception: ${err.message}\n${err.stack}`);
      if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('uncaughtException');
      }
    });
  } catch (error) {
    console.error(`❌ Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
