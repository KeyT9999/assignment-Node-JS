// Nhập model Space để tương tác với collection spaces trong database
const Space = require('../models/spaceModel');

/**
 * Lấy danh sách toàn bộ không gian làm việc (Spaces).
 * GET /spaces
 */
const getAllSpaces = async (req, res) => {
  try {
    const resources = await Space.find();
    return res.status(200).json(resources);
  } catch (error) {
    console.error('Get all resources error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving resources' });
  }
};

/**
 * Lấy thông tin chi tiết một không gian làm việc theo ID.
 * GET /spaces/:id
 */
const getSpaceById = async (req, res) => {
  try {
    const resource = await Space.findById(req.params.id);
    // Trả về lỗi 404 nếu không tìm thấy không gian
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(200).json(resource);
  } catch (error) {
    console.error('Get resource by ID error:', error.message);
    // Xử lý trường hợp ID gửi lên sai định dạng ObjectId của MongoDB
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving resource' });
  }
};

/**
 * Tạo mới một không gian làm việc. (Yêu cầu quyền Admin)
 * POST /spaces
 */
const createSpace = async (req, res) => {
  try {
    const { spaceCode, type, capacity, status, pricePerHour, amenities } = req.body;

    // Kiểm tra các trường thông tin bắt buộc
    if (!spaceCode || !type || pricePerHour === undefined) {
      return res.status(400).json({ message: 'spaceCode, type, and pricePerHour are required' });
    }

    // Đảm bảo không trùng spaceCode với bất kỳ không gian nào khác đã tạo
    const duplicate = await Space.findOne({ spaceCode });
    if (duplicate) {
      return res.status(400).json({ message: 'Space code already exists' });
    }

    // Thực hiện chèn bản ghi mới vào DB
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

/**
 * Cập nhật thông tin một không gian làm việc đang có. (Yêu cầu quyền Admin)
 * PUT /spaces/:id
 */
const updateSpace = async (req, res) => {
  try {
    const { spaceCode, type, capacity, status, pricePerHour, amenities } = req.body;

    // Tìm kiếm không gian cần cập nhật
    const resource = await Space.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Nếu cập nhật spaceCode, kiểm tra xem spaceCode mới có bị trùng lặp ở phòng khác không
    if (spaceCode && spaceCode !== resource.spaceCode) {
      const duplicate = await Space.findOne({ spaceCode });
      if (duplicate) {
        return res.status(400).json({ message: 'Space code already exists' });
      }
      resource.spaceCode = spaceCode;
    }

    // Chỉ cập nhật các thuộc tính nếu chúng được gửi lên trong body của request
    if (type !== undefined) resource.type = type;
    if (capacity !== undefined) resource.capacity = capacity;
    if (status !== undefined) resource.status = status;
    if (pricePerHour !== undefined) resource.pricePerHour = pricePerHour;
    if (amenities !== undefined) resource.amenities = amenities;

    // Lưu các thay đổi vào DB
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

/**
 * Xóa một không gian làm việc khỏi hệ thống. (Yêu cầu quyền Admin)
 * DELETE /spaces/:id
 */
const deleteSpace = async (req, res) => {
  try {
    // Tìm kiểm kiểm tra sự tồn tại của không gian trước khi xóa
    const resource = await Space.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Xóa không gian
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
