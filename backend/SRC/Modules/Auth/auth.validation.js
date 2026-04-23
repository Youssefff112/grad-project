// src/Modules/Auth/auth.validation.js
import Joi from 'joi';

export const registerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(8).required()
      .messages({
        'string.min': 'Password must be at least 8 characters long'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match'
      }),
    userType: Joi.string().valid('onsite', 'offline').required(),
    role: Joi.string().valid('client', 'coach').default('client')
  })
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
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
    password: Joi.string().min(8).required(),
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