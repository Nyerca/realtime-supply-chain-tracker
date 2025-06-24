const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const mongoose = require("mongoose");
const MongoConnector = require("./mongoConnector");

const app = express();
const PORT = 3000;

const mongoUri = "mongodb://mongo1:27017,mongo2:27017,mongo3:27017/db?replicaSet=rs0";
const db = new MongoConnector(mongoUri);

(async () => {
    await db.connect();

    const OrderData = db.getModel("Order");
    const UserData = db.getModel("User");

    app.use(express.static("public"));

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "public/dashboard.html"));
    });

    const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    const wss = new WebSocket.Server({ server });

    async function aggregateData(ws) {
        try {
            const today = new Date();
            const midnightToday = new Date(today.setHours(0, 0, 0, 0));

            const [
                orderCount,
                userCount,
                totalOrderAmount,
                statusCounts,
                usersBeforeToday,
                ordersByCountry,
                usersWithOrders,
                itemRevenues
            ] = await Promise.all([
                OrderData.countDocuments(),
                UserData.countDocuments(),
                OrderData.aggregate([{ $group: { _id: null, total: { $sum: "$header.totalOrderAmount" } } }]),
                OrderData.aggregate([{ $group: { _id: "$header.status", count: { $sum: 1 } } }]),
                UserData.countDocuments({ "centralData.createdOn": { $lt: midnightToday } }),
                OrderData.aggregate([{ $group: { _id: "$header.shipToCountry", count: { $sum: 1 } } }]),
                UserData.aggregate([
                    {
                        $lookup: {
                            from: "orders",
                            localField: "orders",
                            foreignField: "_id",
                            as: "userOrders"
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            orders_users: {
                                $map: {
                                    input: "$userOrders",
                                    as: "order",
                                    in: {
                                        orderId: "$$order._id",
                                        createdOn: "$$order.header.createdOn",
                                        totalOrderAmount: "$$order.header.totalOrderAmount",
                                        status: "$$order.header.status",
                                        email: "$centralData.email",
                                        png: "$centralData.png"
                                    }
                                }
                            }
                        }
                    }
                ]),
                OrderData.aggregate([
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: "$items.itemType",
                            quantity: { $sum: "$items.quantity" },
                            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.pricePerItem"] } }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            itemType: "$_id",
                            quantity: 1,
                            totalRevenue: 1
                        }
                    },
                    { $sort: { quantity: -1 } }
                ])
            ]);

            const formattedStatusCounts = { Pending: 0, Shipped: 0, Received: 0 };
            statusCounts.forEach(item => {
                if (formattedStatusCounts.hasOwnProperty(item._id)) {
                    formattedStatusCounts[item._id] = item.count;
                }
            });

            const item_revenues = {};
            itemRevenues.forEach(item => {
                item_revenues[item.itemType] = {
                    quantity: item.quantity,
                    totalRevenue: item.totalRevenue
                };
            });

            const summary = {
                orderCount,
                userCount,
                totalOrderAmount: totalOrderAmount[0]?.total || 0,
                statusCounts: formattedStatusCounts,
                usersBeforeToday,
                ordersByCountry,
                ordersUsers: usersWithOrders.flatMap(u => u.orders_users),
                item_revenues
            };

            console.log("Sending data to WebSocket client: ", summary)

            ws.send(JSON.stringify(summary));
        } catch (err) {
            console.error("Aggregation error:", err);
        }
    }

    // to update the order from dashboard
    async function handleWebSocketMessage(message, OrderData) {
        try {
            const { orderId, newStatus } = JSON.parse(message);

            if (!orderId || !newStatus) {
                console.warn("Invalid message format:", message);
                return;
            }

            const result = await OrderData.updateOne(
                { _id: new mongoose.Types.ObjectId(orderId) },
                { $set: { "header.status": newStatus } }
            );

            if (result.modifiedCount > 0) {
                console.log(`Order ${orderId} updated to status '${newStatus}'`);
            } else {
                console.warn(`Order ${orderId} not found or already in '${newStatus}'`);
            }
        } catch (err) {
            console.error("Error processing WebSocket message:", err);
        }
    }


    wss.on("connection", (ws) => {
        console.log("Client connected to WebSocket");

        ws.on("message", (message) => {
            handleWebSocketMessage(message, OrderData);
        });

        OrderData.watch().on("change", () => aggregateData(ws));
        UserData.watch().on("change", () => aggregateData(ws));
    });
})();
