const Resource = require('../models/resourceModel');

// @desc    Get all resources
// @route   GET /resources
// @access  Public (or Protected, depending on requirement)
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    return res.status(200).json(resources);
  } catch (error) {
    console.error('Get all resources error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving resources' });
  }
};

// @desc    Get single resource by ID
// @route   GET /resources/:id
// @access  Public
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    return res.status(200).json(resource);
  } catch (error) {
    console.error('Get resource by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resource not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving resource' });
  }
};

// @desc    Create a resource
// @route   POST /resources
// @access  Private/Admin
const createResource = async (req, res) => {
  try {
    const { resourceCode, name, type, capacity, status, pricePerUnit, features } = req.body;

    if (!resourceCode || !type || pricePerUnit === undefined) {
      return res.status(400).json({ message: 'resourceCode, type, and pricePerUnit are required' });
    }

    // Check for duplicate resourceCode
    const duplicate = await Resource.findOne({ resourceCode });
    if (duplicate) {
      return res.status(400).json({ message: 'Resource code already exists' });
    }

    const newResource = await Resource.create({
      resourceCode,
      name,
      type,
      capacity,
      status,
      pricePerUnit,
      features
    });

    return res.status(201).json(newResource);
  } catch (error) {
    console.error('Create resource error:', error.message);
    return res.status(500).json({ message: 'Server error creating resource' });
  }
};

// @desc    Update a resource
// @route   PUT /resources/:id
// @access  Private/Admin
const updateResource = async (req, res) => {
  try {
    const { resourceCode, name, type, capacity, status, pricePerUnit, features } = req.body;

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // If resourceCode is being updated, check for duplicates
    if (resourceCode && resourceCode !== resource.resourceCode) {
      const duplicate = await Resource.findOne({ resourceCode });
      if (duplicate) {
        return res.status(400).json({ message: 'Resource code already exists' });
      }
      resource.resourceCode = resourceCode;
    }

    if (name !== undefined) resource.name = name;
    if (type !== undefined) resource.type = type;
    if (capacity !== undefined) resource.capacity = capacity;
    if (status !== undefined) resource.status = status;
    if (pricePerUnit !== undefined) resource.pricePerUnit = pricePerUnit;
    if (features !== undefined) resource.features = features;

    const updatedResource = await resource.save();
    return res.status(200).json(updatedResource);
  } catch (error) {
    console.error('Update resource error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resource not found' });
    }
    return res.status(500).json({ message: 'Server error updating resource' });
  }
};

// @desc    Delete a resource
// @route   DELETE /resources/:id
// @access  Private/Admin
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await Resource.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Resource removed successfully' });
  } catch (error) {
    console.error('Delete resource error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resource not found' });
    }
    return res.status(500).json({ message: 'Server error deleting resource' });
  }
};

module.exports = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
};
