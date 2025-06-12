#!/bin/bash
sleep 10 # Give containers some time to start

# Wait for mongo1 to be ready before initiating
mongosh --host mongo1:27017 --eval "db.adminCommand('ping')" --quiet
while [ $? -ne 0 ]; do
  echo "Waiting for mongo1 to be ready..."
  sleep 5
  mongosh --host mongo1:27017 --eval "db.adminCommand('ping')" --quiet
done
echo "mongo1 is ready, initiating replica set."

mongosh --host mongo1:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
}, { force: true });
EOF

echo "Replica set initiated."