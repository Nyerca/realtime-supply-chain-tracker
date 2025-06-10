// wait-for-mongo.js

const mongoose = require('mongoose');

const MONGO_URI = "mongodb://mongo1:27017,mongo2:27017,mongo3:27017/iot_db?replicaSet=rs0";

async function waitForMongo(maxRetries = 20, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}: Connecting to Mongo...`);
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000
      });

      const admin = mongoose.connection.db.admin();
      const info = await admin.command({ replSetGetStatus: 1 });

      if (info.ok === 1) {
        console.log("✅ Mongo replica set is ready.");
        await mongoose.disconnect();
        process.exit(0); // Exit successfully
      }
    } catch (err) {
      console.log(`❌ Mongo not ready: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.error("❌ Timed out waiting for Mongo replica set.");
  process.exit(1); // Exit with failure
}

waitForMongo();
