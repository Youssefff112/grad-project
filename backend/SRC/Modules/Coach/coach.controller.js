// src/Modules/Coach/coach.controller.js
import { coachService } from './coach.service.js';
import { coachReviewService } from './coach.review.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';
import { workoutService } from '../Workout/workout.service.js';
import { dietService } from '../Diet/diet.service.js';
import { User } from '../User/user.model.js';
import { AppError } from '../../Utils/appError.utils.js';

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
      successResponse(res, 200, 'Coach clients retrieved', result.clients, result.pagination);
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
      const { userId } = req.body;
      if (!userId) {
        throw new AppError('userId is required', 400);
      }

      const client = await User.findByPk(userId);
      if (!client || client.role !== 'client') {
        throw new AppError('Client not found', 404);
      }

      const plan = await workoutService.generateWorkoutPlanForUser(userId, req.user.id);
      successResponse(res, 201, 'Workout plan assigned', { plan });
    } catch (error) {
      next(error);
    }
  },

  async assignDietPlan(req, res, next) {
    try {
      await coachService.requireApprovedCoach(req.user.id);
      const { userId } = req.body;
      if (!userId) {
        throw new AppError('userId is required', 400);
      }

      const client = await User.findByPk(userId);
      if (!client || client.role !== 'client') {
        throw new AppError('Client not found', 404);
      }

      const plan = await dietService.generateDietPlanForUser(userId, req.user.id);
      successResponse(res, 201, 'Diet plan assigned', { plan });
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
  }
};

