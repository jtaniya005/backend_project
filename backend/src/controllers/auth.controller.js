const User = require("../models/User");
const { generateTokenPair, verifyRefreshToken } = require("../utils/jwt");
const { successResponse, errorResponse } = require("../utils/response");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return errorResponse(res, 409, "Email already registered");

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokenPair(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 201, "Registration successful", { accessToken, refreshToken, user });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user || !user.isActive || !(await user.comparePassword(password)))
      return errorResponse(res, 401, "Invalid credentials");

    const { accessToken, refreshToken } = generateTokenPair(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, "Login successful", { accessToken, refreshToken, user: user.toJSON() });
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 400, "Refresh token required");

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { return errorResponse(res, 401, "Invalid or expired refresh token"); }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) return errorResponse(res, 401, "Refresh token mismatch");

    const { accessToken, refreshToken: newRefresh } = generateTokenPair(user);
    user.refreshToken = newRefresh;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, "Token refreshed", { accessToken, refreshToken: newRefresh });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save({ validateBeforeSave: false });
    return successResponse(res, 200, "Logged out successfully");
  } catch (err) { next(err); }
};

const getMe = (req, res) => successResponse(res, 200, "User profile fetched", { user: req.user });

module.exports = { register, login, refreshToken, logout, getMe };