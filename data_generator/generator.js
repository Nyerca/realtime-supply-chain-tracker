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
const itemTypes = ['Food', 'Medicine', 'Service'];

const OrderSchema = new mongoose.Schema({}, { strict: false });
const OrderData = mongoose.model("Orders", OrderSchema, "orders");
const UserSchema = new mongoose.Schema({}, { strict: false });
const UserData = mongoose.model("Users", UserSchema, "users");

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrderAndUser() {
  const countryCode = randomFromArray(Object.keys(countries));
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
  const email = faker.internet.email();

  const order = {
    header: {
      status: 'Pending',
      shipToStreet: street,
      shipToCityPostalCode: postalCode,
      shipToCity: city,
      shipToCountry: countryCode,
      telephone,
      shippingCompany,
      createdOn,
      userEmail: email,
      totalOrderAmount: parseFloat(totalOrderAmount.toFixed(2))
    },
    items
  };

  return {
    order,
    userDetails: {
      street,
      postalCode,
      city,
      countryCode,
      telephone,
      email,
      language: countryInfo.language
    }
  };
}

async function insertOne() {
  try {
    const { order, userDetails } = generateOrderAndUser();

    const insertedOrder = await OrderData.create(order);

    const user = {
      centralData: {
        name: faker.name.findName(),
        language: userDetails.language,
        email: userDetails.email,
        landlinePhone: userDetails.telephone,
        createdOn: new Date()
      },
      addresses: [
        {
          streetHouseNumber: userDetails.street,
          cityPostalCode: userDetails.postalCode,
          city: userDetails.city,
          country: userDetails.countryCode
        }
      ],
      orders: [{ orderId: insertedOrder._id.toString() }]
    };

    await UserData.create(user);
    console.log(`✅ Inserted user & order at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("❌ Insertion error:", err);
  }
}

function startSeeding() {
  insertOne(); // first insert immediately
  setInterval(insertOne, 5000); // every 5 seconds
}
