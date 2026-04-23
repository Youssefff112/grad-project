// src/Utils/successResponse.utils.js
export const successResponse = (res, statusCode, message, data = null, pagination = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
    ...(pagination && { pagination })
  };

  return res.status(statusCode).json(response);
};

