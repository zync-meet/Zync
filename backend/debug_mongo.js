const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
console.log("Connecting to:", uri);

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db();
        const collections = await database.listCollections().toArray();

        console.log("Collections in database:");
        for (const collection of collections) {
            const count = await database.collection(collection.name).countDocuments();
            console.log(`- ${collection.name}: ${count} documents`);
        }


        const uid = "1L3bA0sqKqSzoZGH3W26Tmn8Ltx2";
        let usersCollection = collections.find(c => c.name === 'users')?.name;
        if (!usersCollection) usersCollection = collections.find(c => c.name === 'User')?.name;

        if (usersCollection) {
            console.log(`\nSearching in collection: ${usersCollection}`);
            const user = await database.collection(usersCollection).findOne({ uid: uid });
            console.log(`User search for uid '${uid}':`, user ? "FOUND" : "NOT FOUND");
            if (user) console.log(user);
        } else {
            console.log("\nCould not find 'users' or 'User' collection.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
run();
