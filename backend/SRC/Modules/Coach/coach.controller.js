// src/Modules/Coach/coach.controller.js
import { coachService } from './coach.service.js';
import { coachReviewService } from './coach.review.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';
import { workoutService } from '../Workout/workout.service.js';
import { WorkoutPlan } from '../Workout/workout.model.js';
import { dietService } from '../Diet/diet.service.js';
import { DietPlan } from '../Diet/diet.model.js';
import { progressService } from '../Progress/progress.service.js';
import { User } from '../User/user.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { AppError } from '../../Utils/appError.utils.js';

// Resolve the User.id from what might be a ClientProfile.id or a raw User.id.
// The frontend sends ClientProfile.id (from /coach/clients), so we look it up first.
async function resolveUserId(clientProfileId) {
  const profile = await ClientProfile.findByPk(clientProfileId);
  if (profile) return profile.userId;
  // Fallback: treat the id as a direct userId
  const user = await User.findByPk(clientProfileId);
  if (user && user.role === 'client') return user.id;
  throw new AppError('Client not found', 404);
}

export const coachController = {
  async createCoach(req, res, next) {
    try {
      const coach = await coachService.createCoach(req.body);
      successResponse(res, 201, 'Coach created successfully', { coach });
    } catch (error) {
      next(error);
    }
  },

  async getAllCoaches(req, res, next) {
    try {
      const specialty = req.query.specialty;
      const minRating = req.query.minRating ? parseFloat(req.query.minRating) : null;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const coaches = await coachService.getAllCoaches({
        specialty,
        minRating,
        page,
        limit
      });

      successResponse(res, 200, 'Coaches retrieved successfully', { coaches });
    } catch (error) {
      next(error);
    }
  },

  async getCoachById(req, res, next) {
    try {
      const coach = await coachService.getCoachById(req.params.id);
      successResponse(res, 200, 'Coach retrieved successfully', { coach });
    } catch (error) {
      next(error);
    }
  },

  async updateCoach(req, res, next) {
    try {
      const coach = await coachService.updateCoach(req.params.id, req.body);
      successResponse(res, 200, 'Coach updated successfully', { coach });
    } catch (error) {
      next(error);
    }
  },

  async deleteCoach(req, res, next) {
    try {
      const result = await coachService.deleteCoach(req.params.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const profile = await coachService.getProfile(req.user.id);
      successResponse(res, 200, 'Coach profile retrieved', { profile });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const profile = await coachService.updateProfile(req.user.id, req.body);
      successResponse(res, 200, 'Coach profile updated', { profile });
    } catch (error) {
      next(error);
    }
  },

  async getClients(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await coachService.getClients(req.user.id, page, limit);
      successResponse(res, 200, 'Coach clients retrieved', { clients: result.clients }, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getAnalytics(req, res, next) {
    try {
      const analytics = await coachService.getAnalytics(req.user.id);
      successResponse(res, 200, 'Coach analytics retrieved', { analytics });
    } catch (error) {
      next(error);
    }
  },

  async assignWorkoutPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const { clientId, userId: rawUserId } = req.body;
      const rawId = clientId || rawUserId;
      if (!rawId) {
        throw new AppError('clientId is required', 400);
      }
      const resolvedUserId = await resolveUserId(parseInt(rawId));
      const plan = await workoutService.generateWorkoutPlanForUser(resolvedUserId, req.user.id);
      successResponse(res, 201, 'Workout plan assigned', { plan });
    } catch (error) {
      next(error);
    }
  },

  async assignDietPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const { clientId, userId: rawUserId } = req.body;
      const rawId = clientId || rawUserId;
      if (!rawId) {
        throw new AppError('clientId is required', 400);
      }
      const resolvedUserId = await resolveUserId(parseInt(rawId));
      const plan = await dietService.generateDietPlanForUser(resolvedUserId, req.user.id);
      successResponse(res, 201, 'Diet plan assigned', { plan });
    } catch (error) {
      next(error);
    }
  },

  // ─── Per-client plan management ───────────────────────────────────────────

  async getClientWorkoutPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const userId = await resolveUserId(parseInt(req.params.clientId));
      const plan = await workoutService.getActiveWorkoutPlan(userId);
      successResponse(res, 200, 'Client workout plan retrieved', { plan });
    } catch (error) {
      next(error);
    }
  },

  async getClientDietPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const userId = await resolveUserId(parseInt(req.params.clientId));
      const plan = await dietService.getActiveDietPlan(userId);
      successResponse(res, 200, 'Client diet plan retrieved', { plan });
    } catch (error) {
      next(error);
    }
  },

  async generateWorkoutForClient(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const userId = await resolveUserId(parseInt(req.params.clientId));
      const plan = await workoutService.generateWorkoutPlanForUser(userId, req.user.id);
      successResponse(res, 201, 'Workout plan generated for client', { plan });
    } catch (error) {
      next(error);
    }
  },

  async generateDietForClient(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const userId = await resolveUserId(parseInt(req.params.clientId));
      const plan = await dietService.generateDietPlanForUser(userId, req.user.id);
      successResponse(res, 201, 'Diet plan generated for client', { plan });
    } catch (error) {
      next(error);
    }
  },

  async updateClientWorkoutPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const { planId } = req.params;
      const { weeklySchedule, planName } = req.body;

      const plan = await WorkoutPlan.findByPk(parseInt(planId));
      if (!plan) {
        throw new AppError('Workout plan not found', 404);
      }
      if (plan.assignedByCoachId !== req.user.id) {
        throw new AppError('You can only edit plans you assigned', 403);
      }

      if (weeklySchedule !== undefined) plan.weeklySchedule = weeklySchedule;
      if (planName !== undefined) plan.planName = planName;
      plan.assignedAt = new Date();
      await plan.save();

      successResponse(res, 200, 'Workout plan updated', { plan });
    } catch (error) {
      next(error);
    }
  },

  async updateClientDietPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const { planId } = req.params;
      const { weeklyMealPlan, dailyCalorieTarget, macronutrients, planName } = req.body;

      const plan = await DietPlan.findByPk(parseInt(planId));
      if (!plan) {
        throw new AppError('Diet plan not found', 404);
      }
      if (plan.assignedByCoachId !== req.user.id) {
        throw new AppError('You can only edit plans you assigned', 403);
      }

      if (weeklyMealPlan !== undefined) plan.weeklyMealPlan = weeklyMealPlan;
      if (dailyCalorieTarget !== undefined) plan.dailyCalorieTarget = dailyCalorieTarget;
      if (macronutrients !== undefined) plan.macronutrients = macronutrients;
      if (planName !== undefined) plan.planName = planName;
      plan.assignedAt = new Date();
      await plan.save();

      successResponse(res, 200, 'Diet plan updated', { plan });
    } catch (error) {
      next(error);
    }
  },

  async submitReview(req, res, next) {
    try {
      const { coachId } = req.params;
      const { rating, comment, isAnonymous } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      if (comment && comment.length > 500) {
        throw new AppError('Comment cannot exceed 500 characters', 400);
      }

      const review = await coachReviewService.submitReview(parseInt(coachId), req.user.id, {
        rating,
        comment,
        isAnonymous
      });

      successResponse(res, 201, 'Review submitted successfully', { review });
    } catch (error) {
      next(error);
    }
  },

  async getCoachReviews(req, res, next) {
    try {
      const { coachId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sort = req.query.sort || 'newest';

      const result = await coachReviewService.getCoachReviews(parseInt(coachId), page, limit, sort);
      successResponse(res, 200, 'Reviews retrieved successfully', result.reviews, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async deleteReview(req, res, next) {
    try {
      const { coachId, reviewId } = req.params;
      const result = await coachReviewService.deleteReview(parseInt(reviewId), req.user.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  async checkReviewEligibility(req, res, next) {
    try {
      const { coachId } = req.params;
      const eligibility = await coachReviewService.checkReviewEligibility(parseInt(coachId), req.user.id);
      successResponse(res, 200, 'Eligibility checked', eligibility);
    } catch (error) {
      next(error);
    }
  },

  async getCoachDetail(req, res, next) {
    try {
      const { coachId } = req.params;
      const detail = await coachReviewService.getCoachDetail(parseInt(coachId));
      successResponse(res, 200, 'Coach detail retrieved', { coach: detail });
    } catch (error) {
      next(error);
    }
  },

  async uploadProfilePicture(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      const profile = await coachService.updateProfile(req.user.id, { profilePicture: imageUrl });
      successResponse(res, 200, 'Profile picture uploaded', { profile, imageUrl });
    } catch (error) {
      next(error);
    }
  },

  async addTransformation(req, res, next) {
    try {
      if (!req.files || !req.files.beforeImage || !req.files.afterImage) {
        throw new AppError('Both before and after images are required', 400);
      }

      const { description, clientName, results } = req.body;

      if (!description || !clientName || !results) {
        throw new AppError('Description, client name, and results are required', 400);
      }

      const profile = await coachService.getProfile(req.user.id);
      const transformations = profile.transformations || [];

      const newTransformation = {
        id: Date.now().toString(),
        beforeImageUrl: `/uploads/${req.files.beforeImage[0].filename}`,
        afterImageUrl: `/uploads/${req.files.afterImage[0].filename}`,
        description,
        clientName,
        results,
        createdAt: new Date()
      };

      transformations.push(newTransformation);

      const updated = await coachService.updateProfile(req.user.id, {
        transformations
      });

      successResponse(res, 201, 'Transformation added', { transformation: newTransformation, profile: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteTransformation(req, res, next) {
    try {
      const { transformationId } = req.params;
      const profile = await coachService.getProfile(req.user.id);
      const transformations = (profile.transformations || []).filter(t => t.id !== transformationId);

      await coachService.updateProfile(req.user.id, { transformations });
      successResponse(res, 200, 'Transformation deleted');
    } catch (error) {
      next(error);
    }
  },

  async addCertification(req, res, next) {
    try {
      const { name, issuer, year } = req.body;

      if (!name || !issuer || !year) {
        throw new AppError('Name, issuer, and year are required', 400);
      }

      const profile = await coachService.getProfile(req.user.id);
      const certifications = profile.certifications || [];

      const newCert = {
        id: Date.now().toString(),
        name,
        issuer,
        year,
        createdAt: new Date()
      };

      if (req.file) {
        newCert.certificateImageUrl = `/uploads/${req.file.filename}`;
      }

      certifications.push(newCert);

      const updated = await coachService.updateProfile(req.user.id, { certifications });
      successResponse(res, 201, 'Certification added', { certification: newCert, profile: updated });
    } catch (error) {
      next(error);
    }
  },

  async deleteCertification(req, res, next) {
    try {
      const { certificationId } = req.params;
      const profile = await coachService.getProfile(req.user.id);
      const certifications = (profile.certifications || []).filter(c => c.id !== certificationId);

      await coachService.updateProfile(req.user.id, { certifications });
      successResponse(res, 200, 'Certification deleted');
    } catch (error) {
      next(error);
    }
  },

  // ─── Pending plan approval (coach approves client-generated plans) ─────────

  async getClientPendingWorkoutPlans(req, res, next) {
    try {
      const userId = await resolveUserId(Number(req.params.clientId));
      const plans = await workoutService.getPendingCoachReviewPlans(userId);
      successResponse(res, 200, 'Pending workout plans retrieved', { plans });
    } catch (error) {
      next(error);
    }
  },

  async approveClientWorkoutPlan(req, res, next) {
    try {
      const { planId } = req.params;
      const plan = await workoutService.approveWorkoutPlan(Number(planId), req.user.id);
      successResponse(res, 200, 'Workout plan approved and activated', { plan });
    } catch (error) {
      next(error);
    }
  },

  async getClientPendingDietPlans(req, res, next) {
    try {
      const userId = await resolveUserId(Number(req.params.clientId));
      const plans = await dietService.getPendingCoachReviewDietPlans(userId);
      successResponse(res, 200, 'Pending diet plans retrieved', { plans });
    } catch (error) {
      next(error);
    }
  },

  async approveClientDietPlan(req, res, next) {
    try {
      const { planId } = req.params;
      const plan = await dietService.approveDietPlan(Number(planId), req.user.id);
      successResponse(res, 200, 'Diet plan approved and activated', { plan });
    } catch (error) {
      next(error);
    }
  },

  // Coach reads a specific client's body measurements
  async getClientMeasurements(req, res, next) {
    try {
      const userId = await resolveUserId(Number(req.params.clientId));
      const { measurements } = await progressService.getMeasurements(userId);
      successResponse(res, 200, 'Client measurements retrieved', { measurements });
    } catch (error) {
      next(error);
    }
  },
};

