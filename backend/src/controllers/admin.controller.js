const User = require("../models/User");
const Task = require("../models/Task");
const { successResponse, errorResponse } = require("../utils/response");

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(Number(limit)).sort("-createdAt"),
      User.countDocuments(),
    ]);
    return successResponse(res, 200, "Users fetched", { users, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) return errorResponse(res, 400, "Role must be user or admin");
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, "User role updated", { user });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return errorResponse(res, 400, "Cannot delete your own account");
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 404, "User not found");
    await Task.deleteMany({ owner: req.params.id });
    return successResponse(res, 200, "User and their tasks deleted");
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTasks, tasksByStatus, tasksByPriority] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    ]);
    return successResponse(res, 200, "Stats fetched", { stats: { totalUsers, totalTasks, tasksByStatus, tasksByPriority } });
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getStats };