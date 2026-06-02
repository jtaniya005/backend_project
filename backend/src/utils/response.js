const successResponse = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({ success: true, message, ...data });

const errorResponse = (res, statusCode, message, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { successResponse, errorResponse };