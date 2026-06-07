// src/Modules/User/user.validation.js
import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).trim().pattern(/^[a-zA-Z\u00C0-\u024F' -]+$/),
    lastName: Joi.string().min(2).max(50).trim().pattern(/^[a-zA-Z\u00C0-\u024F' -]+$/),
    // profile is a JSONB column — allow any fields the client sends through
    profile: Joi.object({
      age: Joi.number().min(16).max(80),
      gender: Joi.string().valid('male', 'female', 'other'),
      height: Joi.number().min(80).max(250),
      currentWeight: Joi.number().min(40).max(200),
      bodyFat: Joi.number().min(10).max(45),
      goal: Joi.string(), // accept any goal string (stored in JSONB, no DB-level enum)
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      dietaryPreferences: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ),
      dietaryPreference: Joi.string(),
      allergies: Joi.array().items(Joi.string().max(80)).max(30),
      medicalConditions: Joi.array().items(Joi.string().max(40)).max(20),
      otherMedicalNotes: Joi.string().max(1000).allow('', null),
      homeEquipment: Joi.array().items(Joi.string()),
      notificationSettings: Joi.object().unknown(true),
      privacyPreferences: Joi.object({
        analytics: Joi.boolean(),
        dataSharing: Joi.boolean(),
      }),
      canUseComputerVision: Joi.boolean(),
      canUseAIAssistant: Joi.boolean(),
      waterGoalMl: Joi.number().integer().min(500).max(15000),
    }).unknown(true) // allow any other profile fields (JSONB is flexible)
  })
});

export const completeOnboardingSchema = Joi.object({
  body: Joi.object({
    profile: Joi.object({
      age: Joi.number().min(16).max(80).required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      height: Joi.number().min(80).max(250).required(),
      currentWeight: Joi.number().min(40).max(200).required(),
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