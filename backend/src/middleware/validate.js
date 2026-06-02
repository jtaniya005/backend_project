const { body, param, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errorResponse(res, 422, "Validation failed", errors.array());
  next();
};

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }),
  body("email").trim().isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Min 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Must contain uppercase, lowercase, and a number"),
  validate,
];

const loginValidator = [
  body("email").trim().isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const createTaskValidator = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 3, max: 100 }),
  body("description").optional().trim().isLength({ max: 500 }),
  body("status").optional().isIn(["pending", "in-progress", "completed"]),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("dueDate").optional().isISO8601().withMessage("Must be a valid date"),
  body("tags").optional().isArray(),
  validate,
];

const updateTaskValidator = [
  param("id").isMongoId().withMessage("Invalid task ID"),
  body("title").optional().trim().isLength({ min: 3, max: 100 }),
  body("description").optional().trim().isLength({ max: 500 }),
  body("status").optional().isIn(["pending", "in-progress", "completed"]),
  body("priority").optional().isIn(["low", "medium", "high"]),
  validate,
];

const mongoIdValidator = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  validate,
];

module.exports = { registerValidator, loginValidator, createTaskValidator, updateTaskValidator, mongoIdValidator };