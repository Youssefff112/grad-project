import Joi from 'joi';

export const updateClientProfileSchema = Joi.object({
  body: Joi.object({
    goals: Joi.object().unknown(true),
    preferences: Joi.object().unknown(true),
    medicalNotes: Joi.string().max(5000).allow('', null),
  }).min(1),
});

export const selectCoachSchema = Joi.object({
  body: Joi.object({
    coachId: Joi.number().integer().positive().required(),
  }),
});
