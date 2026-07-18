const mongoose = require('mongoose');

const dropDatabases = async () => {
  const connectionString = 'mongodb://127.0.0.1:27017';
  console.log('Connecting to MongoDB...');
  
  try {
    const conn = await mongoose.connect(connectionString);
    const adminDb = conn.connection.db.admin();
    
    // List all databases
    const dbs = await adminDb.listDatabases();
    const dbNames = dbs.databases.map(db => db.name);
    console.log('Current databases:', dbNames);

    const targets = ['eVChargingSystem', 'EVChargingSystem', 'evChargingSystem'];
    
    for (const target of targets) {
      if (dbNames.some(name => name.toLowerCase() === target.toLowerCase())) {
        console.log(`Dropping conflicting database: ${target}...`);
        const dbToDrop = conn.connection.useDb(target);
        await dbToDrop.dropDatabase();
        console.log(`Successfully dropped ${target}`);
      }
    }
    
    console.log('All conflicting databases dropped successfully! You can now seed and run the project.');
  } catch (error) {
    console.error('Error dropping database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

dropDatabases();
