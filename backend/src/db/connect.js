const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log('\n================================================================');
    console.log('⚠️  MONGODB URI NOT SET IN backend/.env');
    console.log('================================================================\n');
    return false;
  }

  try {
    console.log(`Connecting to MongoDB Atlas Cluster...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB Atlas successfully!');
    return true;
  } catch (err) {
    console.error('\n❌ MongoDB Atlas Connection Error:', err.message);
    console.log('👉 Please ensure your IP Address is whitelisted (0.0.0.0/0) in MongoDB Atlas Network Access settings.\n');
    return false;
  }
}

module.exports = connectDB;
