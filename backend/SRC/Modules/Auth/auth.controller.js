// src/Modules/Auth/auth.controller.js
import { authService } from './auth.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      const token = user.generateToken();
      const refreshToken = user.generateRefreshToken();
      
      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      successResponse(res, 201, 'User registered successfully', {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          role: user.role
        },
        token,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token, refreshToken } = await authService.login(email, password);
      
      successResponse(res, 200, 'Login successful', {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          role: user.role
        },
        token,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const { token, newRefreshToken } = await authService.refreshToken(refreshToken);
      
      successResponse(res, 200, 'Token refreshed successfully', {
        token,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const resetToken = await authService.forgotPassword(email);

      const responseData = {};
      if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_ENABLED === 'false') {
        responseData.resetToken = resetToken;
      }

      successResponse(
        res,
        200,
        'Password reset email sent. Please check your inbox.',
        Object.keys(responseData).length ? responseData : null
      );
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      await authService.resetPassword(token, password);
      
      successResponse(res, 200, 'Password reset successfully. Please login with your new password.');
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      successResponse(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
};

