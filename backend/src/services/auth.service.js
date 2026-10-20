import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import env from '../config/env.js';
import { syncUserSubscriptionStatus } from './payment.service.js';

const SALT_ROUNDS = 10;

/**
 * Register a new user account.
 */
export async function register({ email, password, fullName, phoneNumber, sex }) {
  // Check for existing user
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phoneNumber }],
    },
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'phone number';
    const error = new Error(`A user with that ${field} already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phoneNumber,
      sex,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      sex: true,
      isAdmin: true,
      paymentStatus: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Authenticate a user and return JWT tokens.
 * Stores the refresh token in the database for secure revocation.
 */
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      sex: true,
      isAdmin: true,
      institutionId: true,
      studyLevel: true,
      paymentStatus: true,
      paidUntil: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiry }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiry }
  );

  // Store refresh token in DB for server-side revocation
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7); // Match JWT_REFRESH_EXPIRY default
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiry,
    },
  });

  // Strip passwordHash before returning
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

/**
 * Refresh an expired access token using a valid refresh token.
 * Validates against the database (not just JWT signature).
 */
export async function refreshToken(token) {
  if (!token) {
    const error = new Error('Refresh token is required.');
    error.statusCode = 400;
    throw error;
  }

  // Verify JWT signature first
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }

  // Check token exists in DB (not revoked)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    // Clean up expired token if it exists
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true },
  });

  if (!user) {
    const error = new Error('User no longer exists.');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = jwt.sign(
    { userId: user.id },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiry }
  );

  return { accessToken };
}

/**
 * Logout — revoke the specific refresh token from DB.
 */
export async function logout(token) {
  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }
}

/**
 * Logout from all devices — revoke ALL refresh tokens for a user.
 */
export async function logoutAll(userId) {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Get the current user's full profile (used by GET /auth/me).
 */
export async function getProfile(userId) {
  // Synchronize subscription status based on actual payments
  await syncUserSubscriptionStatus(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      sex: true,
      isAdmin: true,
      institutionId: true,
      studyLevel: true,
      paymentStatus: true,
      paidUntil: true,
      createdAt: true,
      institution: {
        select: {
          id: true,
          name: true,
          shortCode: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

/**
 * Change password for an authenticated user.
 */
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 401;
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    }),
    // Revoke all refresh tokens on password change (security best practice)
    prisma.refreshToken.deleteMany({
      where: { userId },
    }),
  ]);
}

/**
 * Forgot password — generate a secure reset token and store it.
 * Returns the token and user details for sending the reset email.
 */
export async function forgotPassword(email) {
  const normalizedEmail = email?.trim();
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    select: { id: true, email: true, fullName: true },
  });

  // Always return null to prevent email enumeration
  if (!user) return null;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: expiry,
    },
  });

  return { resetToken, user };
}

/**
 * Reset password using a valid reset token.
 */
export async function resetPassword(token, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    const error = new Error('Invalid or expired reset token.');
    error.statusCode = 400;
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    }),
    // Revoke all refresh tokens
    prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    }),
  ]);
}
