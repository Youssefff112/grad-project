// src/Modules/User/user.validation.js
import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).trim(),
    lastName: Joi.string().min(2).max(50).trim(),
    profile: Joi.object({
      age: Joi.number().min(13).max(120),
      gender: Joi.string().valid('male', 'female', 'other'),
      height: Joi.number().min(50).max(300),
      currentWeight: Joi.number().min(20).max(500),
      goal: Joi.string().valid('weight_loss', 'muscle_gain', 'maintenance', 'endurance'),
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      dietaryPreferences: Joi.string().valid('none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo'),
      dietaryPreference: Joi.string().valid('none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo'),
      allergies: Joi.array().items(Joi.string()),
      homeEquipment: Joi.array().items(
        Joi.string().valid('none', 'dumbbells', 'resistance_bands', 'yoga_mat', 'pull_up_bar', 'kettlebell', 'barbell')
      )
    })
  })
});

export const completeOnboardingSchema = Joi.object({
  body: Joi.object({
    profile: Joi.object({
      age: Joi.number().min(13).max(120).required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      height: Joi.number().min(50).max(300).required(),
      currentWeight: Joi.number().min(20).max(500).required(),
      goal: Joi.string().valid('weight_loss', 'muscle_gain', 'maintenance', 'endurance').required(),
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
      dietaryPreferences: Joi.string().valid('none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo'),
      dietaryPreference: Joi.string().valid('none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo'),
      allergies: Joi.array().items(Joi.string()),
      homeEquipment: Joi.when('$userType', {
        is: 'offline',
        then: Joi.array().items(
          Joi.string().valid('none', 'dumbbells', 'resistance_bands', 'yoga_mat', 'pull_up_bar', 'kettlebell', 'barbell')
        ).min(1).required(),
        otherwise: Joi.forbidden()
      })
    }).required()
  })
});