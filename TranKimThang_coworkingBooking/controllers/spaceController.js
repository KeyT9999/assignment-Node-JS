const Space = require('../models/spaceModel');

// @desc    Get all resources
// @route   GET /spaces
// @access  Public (or Protected, depending on requirement)
const getAllSpaces = async (req, res) => {
  try {
    const resources = await Space.find();
    return res.status(200).json(resources);
  } catch (error) {
    console.error('Get all resources error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving resources' });
  }
};

// @desc    Get single resource by ID
// @route   GET /spaces/:id
// @access  Public
const getSpaceById = async (req, res) => {
  try {
    const resource = await Space.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(200).json(resource);
  } catch (error) {
    console.error('Get resource by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving resource' });
  }
};

// @desc    Create a resource
// @route   POST /spaces
// @access  Private/Admin
const createSpace = async (req, res) => {
  try {
    const { spaceCode, type, capacity, status, pricePerHour, amenities } = req.body;

    if (!spaceCode || !type || pricePerHour === undefined) {
      return res.status(400).json({ message: 'spaceCode, type, and pricePerHour are required' });
    }

    // Check for duplicate spaceCode
    const duplicate = await Space.findOne({ spaceCode });
    if (duplicate) {
      return res.status(400).json({ message: 'Space code already exists' });
    }

    const newSpace = await Space.create({
      spaceCode,
      type,
      capacity,
      status,
      pricePerHour,
      amenities
    });

    return res.status(201).json(newSpace);
  } catch (error) {
    console.error('Create resource error:', error.message);
    return res.status(500).json({ message: 'Server error creating resource' });
  }
};

// @desc    Update a resource
// @route   PUT /spaces/:id
// @access  Private/Admin
const updateSpace = async (req, res) => {
  try {
    const { spaceCode, type, capacity, status, pricePerHour, amenities } = req.body;

    const resource = await Space.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // If spaceCode is being updated, check for duplicates
    if (spaceCode && spaceCode !== resource.spaceCode) {
      const duplicate = await Space.findOne({ spaceCode });
      if (duplicate) {
        return res.status(400).json({ message: 'Space code already exists' });
      }
      resource.spaceCode = spaceCode;
    }


    if (type !== undefined) resource.type = type;
    if (capacity !== undefined) resource.capacity = capacity;
    if (status !== undefined) resource.status = status;
    if (pricePerHour !== undefined) resource.pricePerHour = pricePerHour;
    if (amenities !== undefined) resource.amenities = amenities;

    const updatedSpace = await resource.save();
    return res.status(200).json(updatedSpace);
  } catch (error) {
    console.error('Update resource error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(500).json({ message: 'Server error updating resource' });
  }
};

// @desc    Delete a resource
// @route   DELETE /spaces/:id
// @access  Private/Admin
const deleteSpace = async (req, res) => {
  try {
    const resource = await Space.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }

    await Space.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Space removed successfully' });
  } catch (error) {
    console.error('Delete resource error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(500).json({ message: 'Server error deleting resource' });
  }
};

module.exports = {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace
};
