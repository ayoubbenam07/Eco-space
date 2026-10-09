import * as paymentService from '../services/payment.service.js';

/**
 * POST /api/v1/payments/submit
 * User — Upload BaridiMob/CCP receipt screenshot (multipart/form-data).
 * Validation handled by Zod middleware.
 */
export const submit = async (req, res, next) => {
  try {
    const { amount, method, planId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image is required.',
      });
    }

    const payment = await paymentService.submitPayment(req.user.id, {
      amount,
      method,
      planId,
      receiptBuffer: req.file.buffer,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: 'Payment receipt submitted. Awaiting admin verification.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/my-history
 * User — Get history of submitted payment requests with pagination.
 * Query params: ?page=1&limit=20
 */
export const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const result = await paymentService.getPaymentHistory(req.user.id, pageNum, limitNum);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/status
 * User — Quick status check (FREE, PENDING_VERIFICATION, or ACTIVE).
 */
export const getStatus = async (req, res, next) => {
  try {
    const status = await paymentService.getPaymentStatus(req.user.id);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/plans
 * Public (authenticated) — List active subscription plans.
 */
export const getActivePlans = async (_req, res, next) => {
  try {
    const plans = await paymentService.getActivePlans();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};
