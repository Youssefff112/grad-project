// src/Modules/Coach/coach.management.validation.js
import Joi from 'joi';

export const createCoachSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    age: Joi.number().integer().positive().required(),
    trainingLocation: Joi.string().min(2).max(200).required()
  })
});

export const updateCoachSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(120),
    age: Joi.number().integer().positive(),
    trainingLocation: Joi.string().min(2).max(200)
  })
});

