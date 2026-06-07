import Joi from 'joi';

export const generateDietSchema = Joi.object({
  body: Joi.object({
    dietaryPreferences: Joi.alternatives().try(
      Joi.string().max(200),
      Joi.array().items(Joi.string().max(80)).max(20),
    ),
    allergies: Joi.array().items(Joi.string().max(80)).max(30),
    calorieTarget: Joi.number().integer().min(800).max(10000),
  }),
});

export const trackDietSchema = Joi.object({
  body: Joi.object({
    date: Joi.date().iso().required(),
    mealsCompleted: Joi.object().pattern(Joi.string().max(80), Joi.boolean()),
    waterMl: Joi.number().integer().min(0).max(20000),
    notes: Joi.string().max(2000).allow('', null),
  }).min(1),
});

export const dietLogQuerySchema = Joi.object({
  query: Joi.object({
    date: Joi.date().iso(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
});
