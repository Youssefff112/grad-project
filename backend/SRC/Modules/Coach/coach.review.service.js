// backend/SRC/Modules/Coach/coach.review.service.js
import { CoachReview } from '../../Models/CoachReview.js';
import { ClientProfile } from '../Client/client.model.js';
import { CoachProfile } from './coach.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';

export const coachReviewService = {
  async submitReview(coachId, clientId, reviewData) {
    // Check if client has/had this coach assigned
    const clientProfile = await ClientProfile.findOne({
      where: { userId: clientId }
    });

    if (!clientProfile || clientProfile.selectedCoachId !== coachId) {
      throw new AppError('You can only review coaches you have been assigned to', 403);
    }

    // Create the review
    const review = await CoachReview.create({
      coachId,
      clientId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      isAnonymous: reviewData.isAnonymous || false
    });

    // Update coach's average rating
    await this.updateCoachRating(coachId);

    return review;
  },

  async updateCoachRating(coachId) {
    const reviews = await CoachReview.findAll({
      where: { coachId },
      attributes: ['rating']
    });

    if (reviews.length === 0) {
      await CoachProfile.update(
        { rating: 0, ratingCount: 0 },
        { where: { userId: coachId } }
      );
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await CoachProfile.update(
      { rating: averageRating, ratingCount: reviews.length },
      { where: { userId: coachId } }
    );
  },

  async getCoachReviews(coachId, page = 1, limit = 10, sort = 'newest') {
    const offset = (page - 1) * limit;
    const order = sort === 'highest' ? [['rating', 'DESC']] : [['createdAt', 'DESC']];

    const { rows, count } = await CoachReview.findAndCountAll({
      where: { coachId },
      order,
      offset,
      limit,
      raw: true
    });

    // For non-anonymous reviews, fetch client names (or you can include user data)
    // For now, just return the reviews as is
    return {
      reviews: rows.map(review => ({
        ...review,
        authorName: review.isAnonymous ? 'Anonymous' : undefined
      })),
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  },

  async deleteReview(reviewId, clientId) {
    const review = await CoachReview.findByPk(reviewId);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.clientId !== clientId) {
      throw new AppError('You can only delete your own reviews', 403);
    }

    const coachId = review.coachId;
    await review.destroy();

    // Update coach's rating
    await this.updateCoachRating(coachId);

    return { message: 'Review deleted successfully' };
  },

  async checkReviewEligibility(coachId, clientId) {
    const clientProfile = await ClientProfile.findOne({
      where: { userId: clientId }
    });

    if (!clientProfile || clientProfile.selectedCoachId !== coachId) {
      return {
        eligible: false,
        reason: 'You can only review coaches you have been or are currently assigned to'
      };
    }

    // Check if already reviewed
    const existingReview = await CoachReview.findOne({
      where: { coachId, clientId }
    });

    if (existingReview) {
      return {
        eligible: true,
        hasExistingReview: true,
        existingReviewId: existingReview.id
      };
    }

    return { eligible: true };
  },

  async getCoachDetail(coachId) {
    const coach = await CoachProfile.findByPk(coachId);

    if (!coach) {
      throw new AppError('Coach not found', 404);
    }

    // Get review stats
    const reviews = await CoachReview.findAll({
      where: { coachId },
      attributes: ['rating']
    });

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    return {
      ...coach.toJSON(),
      reviewStats: {
        totalReviews: reviews.length,
        averageRating: coach.rating,
        distribution: ratingDistribution
      }
    };
  }
};
