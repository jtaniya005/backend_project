const { verifyAccessToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return errorResponse(res, 401, "Access token required");

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive)
      return errorResponse(res, 401, "User not found or inactive");

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return errorResponse(res, 401, "Access token expired");
    return errorResponse(res, 401, "Invalid access token");
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return errorResponse(res, 403, `Role '${req.user.role}' is not authorized for this action`);
  next();
};

module.exports = { authenticate, authorize };