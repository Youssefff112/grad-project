// src/Middlewares/validation.middleware.js
import { AppError } from '../Utils/appError.utils.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const validationTarget = {};
    
    if (schema.body) validationTarget.body = req.body;
    if (schema.params) validationTarget.params = req.params;
    if (schema.query) validationTarget.query = req.query;

    const { error, value } = schema.validate(validationTarget, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError('Validation error', 400, errors));
    }

    // Replace req with validated values
    if (value.body) req.body = value.body;
    if (value.params) req.params = value.params;
    if (value.query) req.query = value.query;

    next();
  };
};