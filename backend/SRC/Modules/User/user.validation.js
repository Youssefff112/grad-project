// src/Modules/User/user.validation.js
import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).trim(),
    lastName: Joi.string().min(2).max(50).trim(),
    // profile is a JSONB column — allow any fields the client sends through
    profile: Joi.object({
      age: Joi.number().min(13).max(120),
      gender: Joi.string().valid('male', 'female', 'other'),
      height: Joi.number().min(50).max(300),
      currentWeight: Joi.number().min(20).max(500),
      bodyFat: Joi.number().min(0).max(100),
      goal: Joi.string(), // accept any goal string (stored in JSONB, no DB-level enum)
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      dietaryPreferences: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ),
      dietaryPreference: Joi.string(),
      allergies: Joi.array().items(Joi.string()),
      homeEquipment: Joi.array().items(Joi.string()),
      notificationSettings: Joi.object().unknown(true),
      canUseComputerVision: Joi.boolean(),
      canUseAIAssistant: Joi.boolean(),
    }).unknown(true) // allow any other profile fields (JSONB is flexible)
  })
});

export const completeOnboardingSchema = Joi.object({
  body: Joi.object({
    profile: Joi.object({
      age: Joi.number().min(13).max(120).required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      height: Joi.number().min(50).max(300).required(),
      currentWeight: Joi.number().min(20).max(500).required(),
      goal: Joi.string().required(), // accept any goal string
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
      dietaryPreferences: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ),
      dietaryPreference: Joi.string(),
      allergies: Joi.array().items(Joi.string()),
      homeEquipment: Joi.when('$userType', {
        is: 'offline',
        then: Joi.array().items(Joi.string()).min(1).required(),
        otherwise: Joi.forbidden()
      })
    }).unknown(true).required()
  })
});