require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const Laboratory = require('../models/laboratoryModel');
const TestCatalogue = require('../models/testCatalogueModel');
const Reagent = require('../models/reagentModel');
const ReagentLedger = require('../models/reagentLedgerModel');
const Sample = require('../models/sampleModel');
const TestExecution = require('../models/testExecutionModel');
const ReagentTransaction = require('../models/reagentTransactionModel');

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/labTrack';
  console.log(`Connecting to database for seeding: ${uri}`);
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to database.');

    // Clear existing data
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Laboratory.deleteMany({});
    await TestCatalogue.deleteMany({});
    await Reagent.deleteMany({});
    await ReagentLedger.deleteMany({});
    await Sample.deleteMany({});
    await TestExecution.deleteMany({});
    await ReagentTransaction.deleteMany({});

    // Hash passwords
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Seed Laboratories
    console.log('Seeding Laboratories...');
    const lab1 = await Laboratory.create({
      laboratoryCode: 'LAB-01',
      name: 'CentralCare Da Nang Laboratory',
      location: 'Da Nang',
      maximumActiveSamples: 120,
      currentActiveSamples: 0,
      status: 'active'
    });

    const lab2 = await Laboratory.create({
      laboratoryCode: 'LAB-02',
      name: 'CentralCare Hanoi Laboratory',
      location: 'Hanoi',
      maximumActiveSamples: 50,
      currentActiveSamples: 0,
      status: 'active'
    });

    const lab3 = await Laboratory.create({
      laboratoryCode: 'LAB-03',
      name: 'CentralCare Saigon Small Clinic Lab',
      location: 'Saigon',
      maximumActiveSamples: 2,
      currentActiveSamples: 0,
      status: 'active'
    });

    // 2. Seed Reagents
    console.log('Seeding Reagents...');
    const rgt1 = await Reagent.create({
      reagentCode: 'RGT-01',
      name: 'Glucose Assay Reagent',
      unit: 'ml',
      unitCost: 15.5,
      reorderLevel: 100,
      isActive: true
    });

    const rgt2 = await Reagent.create({
      reagentCode: 'RGT-02',
      name: 'Urinalysis Strips',
      unit: 'strip',
      unitCost: 2.0,
      reorderLevel: 200,
      isActive: true
    });

    const rgt3 = await Reagent.create({
      reagentCode: 'RGT-03',
      name: 'COVID-19 Swab Kit',
      unit: 'kit',
      unitCost: 45.0,
      reorderLevel: 50,
      isActive: true
    });

    // 3. Seed Reagent Ledger (Stock Batches)
    console.log('Seeding Reagent Ledgers...');
    
    // Non-expired batches (Glucose)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year expiry

    const mediumDate = new Date();
    mediumDate.setMonth(mediumDate.getMonth() + 6); // 6 months expiry (expires first)

    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1); // 1 month expired (should not be used!)

    // For Lab 1 - Glucose
    await ReagentLedger.create({
      reagentId: rgt1._id,
      laboratoryId: lab1._id,
      batchNumber: 'B-GLU-01',
      expiryDate: futureDate,
      quantity: 150
    });

    await ReagentLedger.create({
      reagentId: rgt1._id,
      laboratoryId: lab1._id,
      batchNumber: 'B-GLU-02',
      expiryDate: mediumDate,
      quantity: 50
    });

    await ReagentLedger.create({
      reagentId: rgt1._id,
      laboratoryId: lab1._id,
      batchNumber: 'B-GLU-EXP',
      expiryDate: pastDate,
      quantity: 100
    });

    // For Lab 1 - Strips
    await ReagentLedger.create({
      reagentId: rgt2._id,
      laboratoryId: lab1._id,
      batchNumber: 'B-URI-01',
      expiryDate: futureDate,
      quantity: 500
    });

    // 4. Seed Test Catalogue
    console.log('Seeding Test Catalogues...');
    const test1 = await TestCatalogue.create({
      testCode: 'TEST-GLU',
      name: 'Fasting Blood Glucose',
      category: 'biochemistry',
      sampleType: 'blood',
      standardFee: 150,
      estimatedMinutes: 30,
      requiredReagents: [
        { reagentId: rgt1._id, quantityRequired: 10 }
      ],
      isActive: true
    });

    const test2 = await TestCatalogue.create({
      testCode: 'TEST-CBC',
      name: 'Complete Blood Count',
      category: 'hematology',
      sampleType: 'blood',
      standardFee: 250,
      estimatedMinutes: 45,
      requiredReagents: [],
      isActive: true
    });

    // 5. Seed Users
    console.log('Seeding Users...');
    const manager = await User.create({
      username: 'labManager1',
      password: '123456', // will be hashed by userModel pre-save hook
      fullName: 'Dr. Alexander Smith',
      role: 'laboratory_manager',
      assignedLaboratory: null,
      isActive: true
    });

    const technician = await User.create({
      username: 'technician1',
      password: '123456',
      fullName: 'Sarah Jenkins',
      role: 'laboratory_technician',
      assignedLaboratory: lab1._id,
      isActive: true
    });

    const auditor = await User.create({
      username: 'labAuditor1',
      password: '123456',
      fullName: 'Quality Auditor',
      role: 'quality_auditor',
      assignedLaboratory: null,
      isActive: true
    });

    const deactivated = await User.create({
      username: 'deactivatedUser',
      password: '123456',
      fullName: 'John Doe (Deactivated)',
      role: 'laboratory_technician',
      assignedLaboratory: lab1._id,
      isActive: false
    });

    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log(`- Laboratory Manager   : username: labManager1, password: 123456`);
    console.log(`- Laboratory Technician: username: technician1, password: 123456`);
    console.log(`- Quality Auditor      : username: labAuditor1, password: 123456`);
    console.log(`- Deactivated Tech     : username: deactivatedUser, password: 123456`);
    console.log('------------------------------------');
    console.log('Sample Records created:');
    console.log(`- Laboratory 1 (Da Nang) ID: ${lab1._id}`);
    console.log(`- Laboratory 2 (Hanoi)   ID: ${lab2._id}`);
    console.log(`- Laboratory 3 (Saigon)  ID: ${lab3._id}`);
    console.log(`- Reagent 1 (Glucose)    ID: ${rgt1._id}`);
    console.log(`- Reagent 2 (Urine)      ID: ${rgt2._id}`);
    console.log(`- Test 1 (Glucose test)  ID: ${test1._id}`);
    console.log(`- Test 2 (CBC test)      ID: ${test2._id}`);
    console.log('------------------------------------');

  } catch (error) {
    console.error('Seeding database failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seed();
