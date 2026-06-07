// src/Modules/Auth/auth.validation.js
import Joi from 'joi';

const passwordField = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must be at most 128 characters long',
    'string.pattern.base': 'Password must include uppercase, lowercase, and a number',
  });

export const registerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .trim()
      .pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)
      .required()
      .messages({ 'string.pattern.base': 'Please enter a valid email address' }),
    password: passwordField,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match'
      }),
    userType: Joi.string().valid('onsite', 'offline').required(),
    role: Joi.string().valid('client', 'coach').default('client'),
  })
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .trim()
      .pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)
      .required()
      .messages({ 'string.pattern.base': 'Please enter a valid email address' }),
    password: Joi.string().required()
  })
});

export const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
  })
});

export const resetPasswordSchema = Joi.object({
  body: Joi.object({
    password: passwordField,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }),
  params: Joi.object({
    token: Joi.string().required()
  })
});

export const refreshTokenSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  })
});

export const changePasswordSchema = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordField.messages({ 'string.min': 'New password must be at least 8 characters long' }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  })
});