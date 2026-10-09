import * as authService from '../services/auth.service.js';

/**
 * POST /api/v1/auth/register
 * Public — Register a new student account.
 * Validation handled by Zod middleware.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phoneNumber, sex } = req.body;

    const user = await authService.register({ email, password, fullName, phoneNumber, sex });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Public — Authenticate user & return JWT tokens.
 * Validation handled by Zod middleware.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Public — Refresh expired access token.
 * Validation handled by Zod middleware.
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    const result = await authService.refreshToken(token);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * User — Get current logged-in user profile & subscription status.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * User — Invalidate the refresh token server-side.
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Refresh token revoked.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout-all
 * User — Revoke ALL refresh tokens for the current user (all devices).
 */
export const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices. All refresh tokens revoked.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/change-password
 * User — Change password (requires current password).
 * Validation handled by Zod middleware.
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 * Public — Request a password reset token.
 * Validation handled by Zod middleware.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const resetToken = await authService.forgotPassword(email);

    // In production, send this token via email.
    // For now, return it in response (dev/testing only).
    const response = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been generated.',
    };

    // Only include token in non-production for testing
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Public — Reset password using a valid reset token.
 * Validation handled by Zod middleware.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
