const mongoose = require('mongoose');
const faker = require('faker');
faker.locale = 'en';

mongoose.connect("mongodb://mongo1:27017,mongo2:27017,mongo3:27017/iot_db?replicaSet=rs0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB replica set");
  startSeeding();
}).catch(err => {
  console.error("❌ Failed to connect to MongoDB:", err);
  process.exit(1);
});

const countries = {
  IT: { cities: ['Rome', 'Milan', 'Florence'], language: 'IT' },
  FR: { cities: ['Paris', 'Lyon', 'Nice'], language: 'FR' },
  DE: { cities: ['Berlin', 'Hamburg', 'Munich'], language: 'DE' },
  ES: { cities: ['Madrid', 'Barcelona', 'Seville'], language: 'ES' },
  US: { cities: ['New York', 'Los Angeles', 'Chicago'], language: 'EN' }
};

const shippingCompanies = ['DHL', 'FedEx', 'UPS', 'Hermes', 'USPS'];
const itemTypes = ['Food', 'Medicine', 'Service', 'Equipment'];

const OrderSchema = new mongoose.Schema({}, { strict: false });
const OrderData = mongoose.model("Orders", OrderSchema, "orders");
const UserSchema = new mongoose.Schema({}, { strict: false });
const UserData = mongoose.model("Users", UserSchema, "users");

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrder(countryCodeOverride = null) {
  const countryCode = countryCodeOverride || randomFromArray(Object.keys(countries));
  const countryInfo = countries[countryCode];
  const city = randomFromArray(countryInfo.cities);
  const postalCode = faker.address.zipCode();
  const street = faker.address.streetAddress();
  const telephone = faker.phone.phoneNumber('+491#########');
  const shippingCompany = randomFromArray(shippingCompanies);
  const createdOn = new Date();

  const itemCount = faker.datatype.number({ min: 1, max: 8 });
  const items = Array.from({ length: itemCount }).map(() => {
    const quantity = faker.datatype.number({ min: 1, max: 5 });
    const pricePerItem = parseFloat(faker.commerce.price(5, 100));
    return {
      itemId: faker.datatype.uuid(),
      itemType: randomFromArray(itemTypes),
      quantity,
      itemDescription: faker.commerce.product(),
      pricePerItem,
      currency: 'EUR'
    };
  });

  const totalOrderAmount = items.reduce((sum, item) => sum + item.quantity * item.pricePerItem, 0);

  return {
    order: {
      header: {
        status: 'Pending',
        shipToStreet: street,
        shipToCityPostalCode: postalCode,
        shipToCity: city,
        shipToCountry: countryCode,
        telephone,
        shippingCompany,
        createdOn,
        totalOrderAmount: parseFloat(totalOrderAmount.toFixed(2))
      },
      items
    },
    metadata: {
      street,
      postalCode,
      city,
      telephone,
      countryCode,
      language: countryInfo.language
    }
  };
}

let userInsertCounter = 0;

async function insertOne() {
  try {
    let useExistingUser = false;

    if (userInsertCounter >= 5) {
      useExistingUser = Math.random() < 0.3;
    }

    if (useExistingUser) {
      const userCount = await UserData.countDocuments();
      if (userCount === 0) return;

      const [user] = await UserData.aggregate([{ $sample: { size: 1 } }]);
      const { order } = generateOrder(user.addresses[0].country);
      const insertedOrder = await OrderData.create(order);

      await UserData.updateOne(
        { _id: user._id },
        { $push: { orders: insertedOrder._id } }
      );

      console.log(`🔁 Added new order to existing user (${user._id}) at ${new Date().toISOString()}`);
    } else {
      const { order, metadata } = generateOrder();
      const insertedOrder = await OrderData.create(order);

      const user = {
        centralData: {
          name: faker.name.findName(),
          language: metadata.language,
          email: faker.internet.email(),
          landlinePhone: metadata.telephone,
          createdOn: new Date(),
          png: `https://s3-us-west-2.amazonaws.com/s.cdpn.io/584938/people_${faker.datatype.number({ min: 1, max: 12 })}.png`
        },
        addresses: [
          {
            streetHouseNumber: metadata.street,
            cityPostalCode: metadata.postalCode,
            city: metadata.city,
            country: metadata.countryCode
          }
        ],
        orders: [insertedOrder._id]
      };

      await UserData.create(user);
      userInsertCounter++;
      console.log(`✅ Created new user & order #${userInsertCounter} at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error("❌ Insertion error:", err);
  }
}

function startSeeding() {
  insertOne(); // first insert immediately
  setInterval(insertOne, 5000); // every 5 seconds
}
