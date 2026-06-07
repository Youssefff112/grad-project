import Joi from 'joi';

export const updateCoachProfileSchema = Joi.object({
  body: Joi.object({
    bio: Joi.string().max(2000).allow('', null),
    specialties: Joi.array().items(Joi.string().max(100)).max(20),
    experienceYears: Joi.number().integer().min(0).max(60),
    certifications: Joi.array().items(Joi.object().unknown(true)).max(30),
    availability: Joi.object().unknown(true),
    profilePicture: Joi.string().max(500).allow('', null),
    gallery: Joi.array().items(Joi.string().max(500)).max(50),
    transformations: Joi.array().items(Joi.object().unknown(true)).max(30),
  }).min(1),
});

export const clientIdParamSchema = Joi.object({
  params: Joi.object({
    clientId: Joi.number().integer().positive().required(),
  }),
});

export const getClientsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    includeActivity: Joi.boolean().truthy('true', '1').falsy('false', '0').default(false),
  }),
});

export const clientActivityQuerySchema = Joi.object({
  params: Joi.object({
    clientId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    days: Joi.number().integer().min(1).max(60).default(14),
  }),
});

export const assignPlanSchema = Joi.object({
  body: Joi.object({
    clientId: Joi.number().integer().positive(),
    userId: Joi.number().integer().positive(),
  }).or('clientId', 'userId'),
});
