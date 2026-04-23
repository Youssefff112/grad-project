// src/Modules/Vision/vision.service.js
import { VisionSession } from './vision.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const visionService = {
  // ─── COMPUTER VISION INTEGRATION POINT ───────────────────────────────────────
  // TODO (CV Team): `startSession` creates the DB record for a vision session.
  // The real-time pose estimation and rep-counting logic should run on the mobile
  // client (React Native) using a TFLite / MediaPipe model, then call:
  //   PATCH /api/v1/vision/sessions/:id  with { repsCount, accuracyScore, feedback, rawData }
  // after each set or at the end of the session.
  //
  // If server-side CV is needed (e.g. for video upload analysis), implement it here:
  //   1. Receive an uploaded video or image frames via multipart upload.
  //   2. Run inference (e.g. Google Cloud Video Intelligence / a custom TF Serving model).
  //   3. Return repsCount, accuracyScore, and per-frame feedback.
  //   4. Call `updateSession` to persist results.
  // ─────────────────────────────────────────────────────────────────────────────
  async startSession(userId, data) {
    const { exerciseName, startedAt } = data;
    if (!exerciseName) {
      throw new AppError('exerciseName is required', 400);
    }

    return VisionSession.create({
      userId,
      exerciseName,
      startedAt: startedAt ? new Date(startedAt) : new Date()
    });
  },

  async updateSession(userId, sessionId, data) {
    const session = await VisionSession.findOne({ where: { id: sessionId, userId } });
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (data.repsCount !== undefined) session.repsCount = data.repsCount;
    if (data.accuracyScore !== undefined) session.accuracyScore = data.accuracyScore;
    if (data.feedback !== undefined) session.feedback = data.feedback;
    if (data.rawData !== undefined) session.rawData = data.rawData;
    if (data.endedAt !== undefined) session.endedAt = new Date(data.endedAt);

    await session.save();
    return session;
  },

  async getHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { rows, count } = await VisionSession.findAndCountAll({
      where: { userId },
      order: [['startedAt', 'DESC']],
      offset,
      limit
    });

    return {
      sessions: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }
};

