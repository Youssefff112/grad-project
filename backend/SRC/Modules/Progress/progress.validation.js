import Joi from 'joi';

export const addMeasurementSchema = Joi.object({
  body: Joi.object({
    weight: Joi.number().min(40).max(200),
    bodyFat: Joi.number().min(10).max(45),
    chest: Joi.number().min(0).max(300),
    waist: Joi.number().min(0).max(300),
    hips: Joi.number().min(0).max(300),
    arms: Joi.number().min(0).max(200),
    thighs: Joi.number().min(0).max(200),
    measuredAt: Joi.date().iso(),
    notes: Joi.string().max(2000).allow('', null),
  }).min(1),
});

export const paginationSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
});

export const addAccuracySchema = Joi.object({
  body: Joi.object({
    exerciseName: Joi.string().trim().max(200).required(),
    score: Joi.number().min(0).max(100).required(),
    sessionId: Joi.number().integer().positive(),
    notes: Joi.string().max(2000).allow('', null),
    recordedAt: Joi.date().iso(),
  }),
});
