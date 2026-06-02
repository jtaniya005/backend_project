const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: { values: ["pending", "in-progress", "completed"], message: "Invalid status" },
      default: "pending",
    },
    priority: {
      type: String,
      enum: { values: ["low", "medium", "high"], message: "Invalid priority" },
      default: "medium",
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) { delete ret.__v; return ret; },
    },
  }
);

taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);