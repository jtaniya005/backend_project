const Task = require("../models/Task");
const { successResponse, errorResponse } = require("../utils/response");

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const filter = {};
    if (req.user.role !== "admin") filter.owner = req.user._id;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).populate("owner", "name email").sort(sort).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Tasks fetched", {
      tasks,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate("owner", "name email");
    if (!task) return errorResponse(res, 404, "Task not found");
    if (req.user.role !== "admin" && task.owner._id.toString() !== req.user._id.toString())
      return errorResponse(res, 403, "Not authorized to view this task");
    return successResponse(res, 200, "Task fetched", { task });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;
    const task = await Task.create({ title, description, status, priority, dueDate, tags, owner: req.user._id });
    await task.populate("owner", "name email");
    return successResponse(res, 201, "Task created", { task });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, 404, "Task not found");
    if (req.user.role !== "admin" && task.owner.toString() !== req.user._id.toString())
      return errorResponse(res, 403, "Not authorized to update this task");

    ["title", "description", "status", "priority", "dueDate", "tags"].forEach((f) => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });
    await task.save();
    await task.populate("owner", "name email");
    return successResponse(res, 200, "Task updated", { task });
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, 404, "Task not found");
    if (req.user.role !== "admin" && task.owner.toString() !== req.user._id.toString())
      return errorResponse(res, 403, "Not authorized to delete this task");
    await task.deleteOne();
    return successResponse(res, 200, "Task deleted successfully");
  } catch (err) { next(err); }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };