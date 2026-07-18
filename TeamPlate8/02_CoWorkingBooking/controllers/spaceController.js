const Space = require('../models/spaceModel');
// @desc    Get all spaces
// @route   GET /spaces
// @access  Public (or Protected, depending on requirement)
const getAllSpaces = async (req, res) => {
  try {
    const spaces = await Space.find();
    return res.status(200).json(spaces);
  }  catch (error) {
    console.error('Get all spaces error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving spaces'
    });
  }
};
// @desc    Get single space by ID
// @route   GET /spaces/:id
// @access  Public
const getSpaceById = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    return res.status(200).json(space);
  }  catch (error) {
    console.error('Get space by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    return res.status(500).json({
      message: 'Server error retrieving space'
    });
  }
};
// @desc    Create a space
// @route   POST /spaces
// @access  Private/Admin
const createSpace = async (req, res) => {
  try {
    const {
      spaceCode,
      name,
      type,
      capacity,
      status,
      pricePerHour,
      amenities
    }
 = req.body;
    if (!spaceCode || !type || pricePerHour === undefined) {
      return res.status(400).json({
        message: 'spaceCode, type, and pricePerHour are required'
      });
    }
    // Check for duplicate spaceCode
    const duplicate = await Space.findOne({
      spaceCode
    });
    if (duplicate) {
      return res.status(400).json({
        message: 'Space code already exists'
      });
    }
    const newSpace = await Space.create({
      spaceCode,
      name,
      type,
      capacity,
      status,
      pricePerHour,
      amenities
    });
    return res.status(201).json(newSpace);
  }  catch (error) {
    console.error('Create space error:', error.message);
    return res.status(500).json({
      message: 'Server error creating space'
    });
  }
};
// @desc    Update a space
// @route   PUT /spaces/:id
// @access  Private/Admin
const updateSpace = async (req, res) => {
  try {
    const {
      spaceCode,
      name,
      type,
      capacity,
      status,
      pricePerHour,
      amenities
    }
 = req.body;
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    // If spaceCode is being updated, check for duplicates
    if (spaceCode && spaceCode !== space.spaceCode) {
      const duplicate = await Space.findOne({
        spaceCode
      });
      if (duplicate) {
        return res.status(400).json({
          message: 'Space code already exists'
        });
      }
      space.spaceCode = spaceCode;
    }
    if (name !== undefined) space.name = name;
    if (type !== undefined) space.type = type;
    if (capacity !== undefined) space.capacity = capacity;
    if (status !== undefined) space.status = status;
    if (pricePerHour !== undefined) space.pricePerHour = pricePerHour;
    if (amenities !== undefined) space.amenities = amenities;
    const updatedSpace = await space.save();
    return res.status(200).json(updatedSpace);
  }  catch (error) {
    console.error('Update space error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    return res.status(500).json({
      message: 'Server error updating space'
    });
  }
};
// @desc    Delete a space
// @route   DELETE /spaces/:id
// @access  Private/Admin
const deleteSpace = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    await Space.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      message: 'Space removed successfully'
    });
  }  catch (error) {
    console.error('Delete space error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    return res.status(500).json({
      message: 'Server error deleting space'
    });
  }
};
module.exports = {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace
};
