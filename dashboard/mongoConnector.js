const mongoose = require("mongoose");

class MongoConnector {
    constructor(uri, options = {}) {
        this.uri = uri;
        this.options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ...options
        };
        this.models = {};
    }

    async connect() {
        try {
            await mongoose.connect(this.uri, this.options);
            console.log("MongoDB connected successfully");

            this.models.Order = mongoose.model("Orders", new mongoose.Schema({}, { strict: false }), "orders");
            this.models.User = mongoose.model("Users", new mongoose.Schema({}, { strict: false }), "users");
        } catch (err) {
            console.error("MongoDB connection error:", err);
            throw err;
        }
    }

    getModel(name) {
        return this.models[name];
    }
}

module.exports = MongoConnector;