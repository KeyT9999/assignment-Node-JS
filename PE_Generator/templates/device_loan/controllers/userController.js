const User = require('../models/userModel');
const Loan = require('../models/loanModel');

exports.list = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const activeLoan = await Loan.findOne({
      userId: req.params.id,
      status: 'borrowing'
    });

    if (activeLoan) {
      return res.status(400).json({ message: 'Cannot delete a user with active loans.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
