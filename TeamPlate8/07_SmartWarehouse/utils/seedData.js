require('dotenv').config();
const mongoose = require('mongoose'), connectDB = require('../config/db'), Warehouse = require('../models/warehouseModel'), User = require('../models/userModel'), Product = require('../models/productModel'), Ledger = require('../models/stockLedgerModel'), Transaction = require('../models/stockTransactionModel');
(async () => {
  try {
    await connectDB();
    await Promise.all([Transaction.deleteMany(), Ledger.deleteMany(), User.deleteMany(), Product.deleteMany(), Warehouse.deleteMany()]);
    const warehouses = await Warehouse.create([{
      code: 'WH-01',
      name: 'Hai Chau Warehouse',
      location: 'Hai Chau, Da Nang',
      maxCapacity: 1000,
      currentLoad: 80
    }, {
      code: 'WH-02',
      name: 'Lien Chieu Warehouse',
      location: 'Lien Chieu, Da Nang',
      maxCapacity: 1500,
      currentLoad: 0
    }, {
      code: 'WH-03',
      name: 'Son Tra Warehouse',
      location: 'Son Tra, Da Nang',
      maxCapacity: 800,
      currentLoad: 0
    }]);
    const products = await Product.create([{
      sku: 'SKU-0042',
      name: 'Wireless Scanner',
      category: 'electronics',
      unit: 'pcs',
      unitPrice: 500000,
      reorderLevel: 100
    }, {
      sku: 'SKU-0100',
      name: 'Office Chair',
      category: 'furniture',
      unit: 'pcs',
      unitPrice: 1200000,
      reorderLevel: 20
    }]);
    await User.create([{
      username: 'manager1',
      password: '123456',
      fullName: 'Warehouse Manager',
      role: 'warehouse_manager'
    }, {
      username: 'keeper1',
      password: '123456',
      fullName: 'Stock Keeper',
      role: 'stock_keeper',
      assignedWarehouse: warehouses[0]._id
    }, {
      username: 'auditor1',
      password: '123456',
      fullName: 'Inventory Auditor',
      role: 'auditor'
    }, {
      username: 'deactivated1',
      password: '123456',
      fullName: 'Deactivated User',
      role: 'stock_keeper',
      isActive: false
    }]);
    await Ledger.create({
      productId: products[0]._id,
      warehouseId: warehouses[0]._id,
      quantity: 80
    });
    console.log('WarePro seed completed')
  } catch (e) {
    console.error(e);
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
})();
