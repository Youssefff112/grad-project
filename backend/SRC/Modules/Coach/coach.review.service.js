// backend/SRC/Modules/Coach/coach.review.service.js
import { CoachReview } from '../../Models/CoachReview.js';
import { ClientProfile } from '../Client/client.model.js';
import { CoachProfile } from './coach.model.js';
import { User } from '../User/user.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const coachReviewService = {
  async submitReview(coachProfileId, clientId, reviewData) {
    const coachProfile = await CoachProfile.findByPk(coachProfileId);
    if (!coachProfile) {
      throw new AppError('Coach not found', 404);
    }

    const clientProfile = await ClientProfile.findOne({
      where: { userId: clientId }
    });

    if (!clientProfile || clientProfile.selectedCoachId !== coachProfile.userId) {
      throw new AppError('You can only review coaches you have been assigned to', 403);
    }

    const review = await CoachReview.create({
      coachId: coachProfileId,
      clientId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      isAnonymous: reviewData.isAnonymous || false
    });

    // Update coach's average rating
    await this.updateCoachRating(coachProfileId);

    return review;
  },

  /** @param coachProfileId Primary key of coach_profiles (same as CoachReview.coachId) */
  async updateCoachRating(coachProfileId) {
    const reviews = await CoachReview.findAll({
      where: { coachId: coachProfileId },
      attributes: ['rating']
    });

    if (reviews.length === 0) {
      await CoachProfile.update(
        { rating: 0, ratingCount: 0 },
        { where: { id: coachProfileId } }
      );
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await CoachProfile.update(
      { rating: averageRating, ratingCount: reviews.length },
      { where: { id: coachProfileId } }
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

  async checkReviewEligibility(coachProfileId, clientId) {
    const coachProfile = await CoachProfile.findByPk(coachProfileId);
    const clientProfile = await ClientProfile.findOne({
      where: { userId: clientId }
    });

    if (!coachProfile || !clientProfile || clientProfile.selectedCoachId !== coachProfile.userId) {
      return {
        eligible: false,
        reason: 'You can only review coaches you have been or are currently assigned to'
      };
    }

    const existingReview = await CoachReview.findOne({
      where: { coachId: coachProfileId, clientId }
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
    const coach = await CoachProfile.findByPk(coachId, {
      include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    if (!coach) {
      throw new AppError('Coach not found', 404);
    }

    const reviews = await CoachReview.findAll({
      where: { coachId },
      attributes: ['rating']
    });

    const totalReviews = reviews.length;
    const avgFromReviews =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;
    const storedRating = Number(coach.rating);
    const displayAverage =
      avgFromReviews != null && Number.isFinite(avgFromReviews)
        ? Math.round(avgFromReviews * 100) / 100
        : Number.isFinite(storedRating)
          ? Math.round(storedRating * 100) / 100
          : 0;

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
        totalReviews,
        averageRating: displayAverage,
        distribution: ratingDistribution
      }
    };
  }
};
