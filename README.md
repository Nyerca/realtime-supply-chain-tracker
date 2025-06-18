How to run the project
docker-compose up --build -d

To stop the project:
docker-compose down
docker-compose down -v # -v removes volumes, ensuring clean state if you had data


## Ping mongo from machine (script or MongoDbCompass)
Windows: Open Notepad as Administrator, then open C:\Windows\System32\drivers\etc\hosts
Add this line:
127.0.0.1 mongo1 mongo2 mongo3

## Local connection String after mapping:
mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0

### Empty the db:
db.orders.deleteMany({})
db.users.deleteMany({})

### Look at replica set initialization:
Manually verify replica set status: 
Connect to one of the MongoDB containers and check the replica set status:  
docker exec -it mongo1 mongo rs.status()


### Investigations:
Open powershell and:        docker inspect mongo1 mongo2 mongo3 | Select-String -Pattern '"Name"|"IPAddress"'