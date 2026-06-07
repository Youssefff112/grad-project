import Joi from 'joi';

export const generateWorkoutSchema = Joi.object({
  body: Joi.object({
    location: Joi.string().valid('home', 'gym', 'outdoor').default('home'),
    equipment: Joi.array().items(Joi.string().max(80)).max(30).default([]),
  }),
});

export const logWorkoutSchema = Joi.object({
  body: Joi.object({
    date: Joi.date().iso(),
    status: Joi.string().valid('completed', 'in_progress', 'skipped').default('completed'),
    exercises: Joi.array().items(Joi.object({
      name: Joi.string().max(200).required(),
      sets: Joi.number().integer().min(0).max(100),
      reps: Joi.number().integer().min(0).max(500),
      weight: Joi.number().min(0).max(2000),
      notes: Joi.string().max(1000).allow('', null),
    })).max(100),
    notes: Joi.string().max(2000).allow('', null),
    sessionMeta: Joi.object().unknown(true),
    durationMinutes: Joi.number().min(0).max(600),
    formScore: Joi.number().min(0).max(100),
  }).min(1),
});

export const startSessionSchema = Joi.object({
  body: Joi.object({
    planId: Joi.number().integer().positive(),
    dayName: Joi.string().max(20),
    exerciseName: Joi.string().max(200),
  }),
});

export const finishSessionSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    exercises: Joi.array().items(Joi.object().unknown(true)).max(100),
    notes: Joi.string().max(2000).allow('', null),
    formScore: Joi.number().min(0).max(100),
    durationMinutes: Joi.number().min(0).max(600),
  }),
});

export const paginationSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
});
