const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = 3000;

mongoose.connect("mongodb://mongo1:27017,mongo2:27017,mongo3:27017/iot_db?replicaSet=rs0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const OrderSchema = new mongoose.Schema({}, { strict: false });
const OrderData = mongoose.model("Orders", OrderSchema, "orders");
const UserSchema = new mongoose.Schema({}, { strict: false });
const UserData = mongoose.model("Users", UserSchema, "users");

app.use(express.static("public"));

// Route to serve your HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/dashboard.html")); // change file name as needed
});

const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");

    OrderData.watch().on("change", (change) => {
        console.log("NEW DATA FROM MONGO")
        if (change.operationType === "insert") {
            ws.send(JSON.stringify(change.fullDocument));
        }
    });
});
