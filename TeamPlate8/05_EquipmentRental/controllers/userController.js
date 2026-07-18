const User = require('../models/userModel');
const Rental = require('../models/rentalModel');
exports.getUsers = async (_req, res) => res.json(await User.find().select('-password'));
exports.deleteUser = async (req, res) => {
  const active = await Rental.exists({
    userId: req.params.id,
    status: 'active'
  });
  if (active) return res.status(400).json({
    message: 'Cannot delete users with active rentals.'
  });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({
    message: 'User not found'
  });
  return res.json({
    message: 'User deleted successfully'
  });
};
