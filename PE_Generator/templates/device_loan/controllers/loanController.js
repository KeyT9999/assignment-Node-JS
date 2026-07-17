const Loan = require('../models/loanModel');
const Device = require('../models/deviceModel');

exports.create = async (req, res) => {
  try {
    const { deviceId, quantity, dueDate } = req.body;
    const userId = req.user.userId;

    if (!deviceId || !quantity || !dueDate) {
      return res.status(400).json({ message: 'deviceId, quantity, and dueDate are required' });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ message: 'quantity must be greater than zero' });
    }

    const due = new Date(dueDate);
    if (due <= new Date()) {
      return res.status(400).json({ message: 'dueDate must be later than the current time' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.status === 'maintenance') {
      return res.status(400).json({ message: 'Device is under maintenance' });
    }

    if (qty > device.availableQuantity) {
      return res.status(400).json({ message: 'Requested quantity is greater than available quantity' });
    }

    // Deduct availableQuantity atomically
    device.availableQuantity -= qty;
    await device.save();

    const depositAmount = device.depositFee * qty;

    const loan = await Loan.create({
      userId,
      deviceId,
      quantity: qty,
      dueDate: due,
      depositAmount,
      status: 'borrowing'
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.returnLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status === 'returned') {
      return res.status(400).json({ message: 'Loan has already been returned' });
    }

    const device = await Device.findById(loan.deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device associated with this loan not found' });
    }

    const now = new Date();
    loan.returnedAt = now;
    loan.status = 'returned';

    // Restore availableQuantity
    device.availableQuantity += loan.quantity;
    await device.save();

    // Check late return
    if (now > loan.dueDate) {
      const lateDays = Math.ceil((now - loan.dueDate) / (1000 * 60 * 60 * 24));
      loan.fineAmount = lateDays * device.finePerDay * loan.quantity;
    }

    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.userId = req.user.userId;
    }
    const loans = await Loan.find(query).populate('userId', 'username').populate('deviceId');
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
