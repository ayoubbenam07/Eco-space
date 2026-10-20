import prisma from '../config/db.js';
import { uploadFile } from './storage.service.js';
import crypto from 'crypto';

/**
 * Submit a payment with receipt image upload.
 * Uploads the receipt to R2 and creates a Payment record.
 * Sets the user's paymentStatus to PENDING_VERIFICATION.
 */
export async function submitPayment(userId, { amount, method, planId, receiptBuffer, originalName, mimetype }) {
  // If planId is provided, validate the plan exists and is active
  if (planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      const error = new Error('Invalid or inactive subscription plan.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Generate a unique key for the receipt in R2
  const ext = originalName.split('.').pop();
  const key = `receipts/${userId}/${crypto.randomUUID()}.${ext}`;

  // Upload receipt to R2
  await uploadFile(receiptBuffer, key, mimetype);

  // Create payment record and update user status in a transaction
  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        userId,
        amount: parseFloat(amount),
        method,
        planId: planId || null,
        receiptImageKey: key,
      },
    });

    // Update user payment status to pending
    await tx.user.update({
      where: { id: userId },
      data: { paymentStatus: 'PENDING_VERIFICATION' },
    });

    return newPayment;
  });

  return payment;
}

/**
 * Get a user's payment history with pagination, ordered by most recent first.
 */
export async function getPaymentHistory(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        method: true,
        isApproved: true,
        rejectionReason: true,
        planId: true,
        createdAt: true,
        updatedAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            durationDays: true,
          },
        },
      },
    }),
    prisma.payment.count({ where: { userId } }),
  ]);

  return {
    data: payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
/**
 * Automatically synchronize and reconcile a user's subscription status based on payment records.
 * - If user has approved payments: sets paymentStatus = ACTIVE and computes paidUntil (or EXPIRED if in past).
 * - If user has unapproved pending payments: sets paymentStatus = PENDING_VERIFICATION.
 * - If user has no active approved or pending payments: sets paymentStatus = FREE.
 */
export async function syncUserSubscriptionStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      paymentStatus: true,
      paidUntil: true,
      isAdmin: true,
    },
  });

  if (!user || user.isAdmin) return user;

  const now = new Date();

  // Find all approved payments for this user with plan info
  const approvedPayments = await prisma.payment.findMany({
    where: { userId, isApproved: true },
    include: { plan: { select: { durationDays: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (approvedPayments.length > 0) {
    let latestExpiry = user.paidUntil ? new Date(user.paidUntil) : null;

    for (const payment of approvedPayments) {
      const durationDays = payment.plan?.durationDays || 30;
      const baseDate = new Date(payment.createdAt || now);
      const paymentExpiry = new Date(baseDate);
      paymentExpiry.setDate(paymentExpiry.getDate() + durationDays);

      if (!latestExpiry || paymentExpiry > latestExpiry) {
        latestExpiry = paymentExpiry;
      }
    }

    if (latestExpiry && latestExpiry > now) {
      if (user.paymentStatus !== 'ACTIVE' || !user.paidUntil || new Date(user.paidUntil).getTime() !== latestExpiry.getTime()) {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            paymentStatus: 'ACTIVE',
            paidUntil: latestExpiry,
          },
        });
        return updated;
      }
      return user;
    } else if (latestExpiry && latestExpiry <= now) {
      if (user.paymentStatus !== 'EXPIRED') {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            paymentStatus: 'EXPIRED',
          },
        });
        return updated;
      }
      return user;
    }
  }

  // Check if user has an unapproved pending payment
  const pendingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      isApproved: false,
      rejectionReason: null,
    },
  });

  if (pendingPayment) {
    if (user.paymentStatus !== 'PENDING_VERIFICATION') {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { paymentStatus: 'PENDING_VERIFICATION' },
      });
      return updated;
    }
    return user;
  }

  // No approved active payments and no pending payments
  if (user.paymentStatus !== 'FREE' || user.paidUntil !== null) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        paymentStatus: 'FREE',
        paidUntil: null,
      },
    });
    return updated;
  }

  return user;
}

/**
 * Quick payment status check for a user.
 */
export async function getPaymentStatus(userId) {
  const syncedUser = await syncUserSubscriptionStatus(userId);

  if (!syncedUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    status: syncedUser.paymentStatus,
    paidUntil: syncedUser.paidUntil,
  };
}

/**
 * Get all active subscription plans (for user-facing plan selection).
 */
export async function getActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
    select: {
      id: true,
      name: true,
      durationDays: true,
      price: true,
    },
  });
}

/**
 * Admin: Approve a payment and activate the user's subscription.
 *
 * @param {string} paymentId
 * @param {number} durationDays - How many days the subscription should last (e.g. 30, 90, 365)
 */
export async function approvePayment(paymentId, durationDays = 30) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, userId: true, isApproved: true, planId: true },
    include: {
      plan: { select: { durationDays: true } },
    },
  });

  if (!payment) {
    const error = new Error('Payment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payment.isApproved) {
    const error = new Error('This payment has already been approved.');
    error.statusCode = 400;
    throw error;
  }

  // Use plan's duration if available, otherwise fall back to provided durationDays
  const actualDuration = payment.plan?.durationDays || durationDays;

  const paidUntil = new Date();
  paidUntil.setDate(paidUntil.getDate() + actualDuration);

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: { isApproved: true },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        paymentStatus: 'ACTIVE',
        paidUntil,
      },
    });

    return updatedPayment;
  });

  return { payment: result, paidUntil };
}

/**
 * Admin: Reject a payment with a reason.
 * Resets the user's payment status to FREE.
 */
export async function rejectPayment(paymentId, reason) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, userId: true, isApproved: true },
  });

  if (!payment) {
    const error = new Error('Payment not found.');
    error.statusCode = 404;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        isApproved: false,
        rejectionReason: reason || 'No reason provided.',
      },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: { paymentStatus: 'FREE' },
    });

    return updatedPayment;
  });

  return result;
}

/**
 * Admin: Get all payments with PENDING_VERIFICATION status.
 */
export async function getPendingPayments() {
  const pendingUsers = await prisma.user.findMany({
    where: { paymentStatus: 'PENDING_VERIFICATION' },
    select: { id: true },
  });

  const userIds = pendingUsers.map((u) => u.id);

  const payments = await prisma.payment.findMany({
    where: {
      userId: { in: userIds },
      isApproved: false,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      amount: true,
      method: true,
      receiptImageKey: true,
      isApproved: true,
      rejectionReason: true,
      planId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          durationDays: true,
        },
      },
    },
  });

  return payments;
}
