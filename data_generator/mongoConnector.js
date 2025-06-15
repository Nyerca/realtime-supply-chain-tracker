const mongoose = require('mongoose');

class MongoConnector {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = {
      ...options,
      serverSelectionTimeoutMS: 3000 // for fast failure
    };
  }

  async waitForReplicaSet(maxRetries = 20, delayMs = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Connecting to Mongo...`);
        await mongoose.connect(this.uri, this.options);

        const admin = mongoose.connection.db.admin();
        const info = await admin.command({ replSetGetStatus: 1 });

        if (info.ok === 1) {
          console.log("✅ Mongo replica set is ready.");
          await mongoose.disconnect(); // clean reconnect later in connect()
          return true;
        }
      } catch (err) {
        console.log(`❌ Mongo not ready: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    console.error("❌ Timed out waiting for Mongo replica set.");
    process.exit(1);
  }

  async connect() {
    await this.waitForReplicaSet();

    try {
      await mongoose.connect(this.uri, this.options);
      console.log("✅ Connected to MongoDB");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      process.exit(1);
    }
  }

  getModel(name, schemaDef = {}, collectionName = null) {
    const schema = new mongoose.Schema(schemaDef, { strict: false });
    return mongoose.model(name, schema, collectionName || name.toLowerCase());
  }
}

module.exports = MongoConnector;