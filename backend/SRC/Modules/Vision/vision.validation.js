import Joi from 'joi';

/** ~4 MB raw image ≈ 5.5M base64 chars; cap below global 10 MB JSON limit. */
const MAX_BASE64_LENGTH = 5_500_000;

export const analyzeFrameSchema = Joi.object({
  body: Joi.object({
    image_base64: Joi.string()
      .max(MAX_BASE64_LENGTH)
      .pattern(/^[A-Za-z0-9+/=\s]+$/)
      .required()
      .messages({ 'string.max': 'Image payload is too large' }),
    exercise_name: Joi.string().trim().max(100).default('squat'),
  }),
});

export const startVisionSessionSchema = Joi.object({
  body: Joi.object({
    exerciseName: Joi.string().trim().max(100).required(),
    rawData: Joi.object().unknown(true).default({}),
  }),
});

export const updateVisionSessionSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    rawData: Joi.object().unknown(true),
    endedAt: Joi.date().iso(),
    summary: Joi.object().unknown(true),
  }).min(1),
});

export const visionHistorySchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
});
