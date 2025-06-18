# Project Description
The project is a sample dashboard for an order+users domain (two collections), the dashboard is updated in realtime and the Node.js server captures the event in realtime.
To capture the event in realtime it uses 'Change Streams'
g.e.:  ``` OrderData.watch().on("change", () => aggregateData(ws)); ```
Change Streams is a feature that allows applications to listen in real-time to changes (like inserts, updates, deletes) that happen in a MongoDB collection without polling.
Change Streams only work if MongoDB is running as a replica set or sharded cluster, so this application follows that rule and used a Replica Set.
A dashboard being updated in realtime via Node.js Change Streams is the best practice to build a Dashboard.

In the Dashboard we see some aggregated data (updated in realtime) and also we allow the user to change the order status and see the change also in realtime.

# Run the project

Prerequisite to run the project is to allow the localhost to see the mongo replica set also from outside the container (So from localhost and mongoDbCompass), to do so:
Windows: Open Notepad as Administrator, then open C:\Windows\System32\drivers\etc\hosts
Add this line:
```127.0.0.1 mongo1 mongo2 mongo3```

To run the project ``` docker-compose up --build -d ```

To stop the project: ``` docker-compose down -v ```
-v removes volumes, ensuring clean state

## Connect from MongoDB Compass or source machine using the following connection string
```mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0```

## Empty the db:
```db.orders.deleteMany({})```
```db.users.deleteMany({})```

## Investigate Issues:

**Look at replica set initialization**:
```docker exec -it mongo1 mongo rs.status()```
That command connects to one of the MongoDB containers and check the replica set status

## Investigate the exposed IP:
Open powershell and:  ```docker inspect mongo1 mongo2 mongo3 | Select-String -Pattern '"Name"|"IPAddress"'```