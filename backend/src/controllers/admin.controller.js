import prisma from '../config/db.js';
import * as paymentService from '../services/payment.service.js';
import { uploadFile, deleteFile, generateSignedUrl } from '../services/storage.service.js';
import crypto from 'crypto';

// ============================================================
// PAYMENT VERIFICATION
// ============================================================

/**
 * GET /api/v1/admin/payments/pending
 * Admin — List all pending BaridiMob/CCP submissions.
 */
export const getPendingPayments = async (_req, res, next) => {
  try {
    const payments = await paymentService.getPendingPayments();

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/payments/history
 * Admin — View all payment history with filtering and pagination.
 * Query params: ?page=1&limit=20&status=APPROVED|REJECTED|ALL&method=BARIDIMOB&from=2026-01-01&to=2026-12-31
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      method,
      from,
      to,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Filter by approval status
    if (status === 'APPROVED') where.isApproved = true;
    else if (status === 'REJECTED') {
      where.isApproved = false;
      where.rejectionReason = { not: null };
    }

    // Filter by payment method
    if (method) where.method = method;

    // Filter by date range
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          method: true,
          receiptImageKey: true,
          isApproved: true,
          rejectionReason: true,
          planId: true,
          createdAt: true,
          updatedAt: true,
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
      }),
      prisma.payment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/payments/:id/receipt-url
 * Admin — Generate a signed URL to view/download the receipt image.
 */
export const getReceiptUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { id: true, receiptImageKey: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }

    if (!payment.receiptImageKey) {
      return res.status(404).json({
        success: false,
        message: 'No receipt image attached to this payment.',
      });
    }

    const url = await generateSignedUrl(payment.receiptImageKey, 300); // 5 minutes

    res.status(200).json({
      success: true,
      data: {
        url,
        expiresIn: 300,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/payments/:id/approve
 * Admin — Approve receipt, activate user subscription.
 */
export const approvePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationDays } = req.body;

    const result = await paymentService.approvePayment(
      id,
      durationDays ? parseInt(durationDays, 10) : 30
    );

    res.status(200).json({
      success: true,
      message: 'Payment approved. User subscription activated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/payments/:id/reject
 * Admin — Reject payment with reason.
 */
export const rejectPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await paymentService.rejectPayment(id, reason);

    res.status(200).json({
      success: true,
      message: 'Payment rejected.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CONTENT MANAGEMENT — INSTITUTIONS
// ============================================================

/**
 * POST /api/v1/admin/institutions
 * Admin — Add new École Nationale.
 * Validation handled by Zod middleware.
 */
export const createInstitution = async (req, res, next) => {
  try {
    const { name, shortCode, focus, description } = req.body;

    const institution = await prisma.institution.create({
      data: {
        name,
        shortCode,
        focus: focus || null,
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Institution created successfully.',
      data: institution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/institutions/:id
 * Admin — Update institution details.
 * Validation handled by Zod middleware.
 */
export const updateInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, shortCode, focus, description } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (shortCode !== undefined) updateData.shortCode = shortCode;
    if (focus !== undefined) updateData.focus = focus;
    if (description !== undefined) updateData.description = description;

    const institution = await prisma.institution.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Institution updated successfully.',
      data: institution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/institutions/:id
 * Admin — Delete institution (cascades to courses and resources).
 */
export const deleteInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.institution.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      message: 'Institution and its courses/resources deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CONTENT MANAGEMENT — COURSES
// ============================================================

/**
 * POST /api/v1/admin/courses
 * Admin — Create new course under a school.
 * Validation handled by Zod middleware.
 */
export const createCourse = async (req, res, next) => {
  try {
    const { institutionId, title, code, yearLevel, semester } = req.body;

    // Verify institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.',
      });
    }

    const course = await prisma.course.create({
      data: {
        institutionId,
        title,
        code,
        yearLevel,
        semester,
      },
      include: {
        institution: {
          select: { id: true, name: true, shortCode: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/courses/:id
 * Admin — Update course details.
 * Validation handled by Zod middleware.
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, code, yearLevel, semester } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code;
    if (yearLevel !== undefined) updateData.yearLevel = yearLevel;
    if (semester !== undefined) updateData.semester = semester;

    const course = await prisma.course.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: {
        institution: {
          select: { id: true, name: true, shortCode: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/courses/:id
 * Admin — Delete course (cascades to resources).
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      message: 'Course and its resources deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CONTENT MANAGEMENT — RESOURCES
// ============================================================

/**
 * GET /api/v1/admin/resources
 * Admin — List all resources (drafts + published) with filtering and pagination.
 * Query params: ?page=1&limit=20&search=math&published=true&courseId=3
 */
export const listResources = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      published,
      courseId,
      resourceType,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (published !== undefined) {
      where.isPublished = published === 'true';
    }

    if (courseId) {
      where.courseId = parseInt(courseId, 10);
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          resourceType: true,
          sizeBytes: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              institution: {
                select: { id: true, shortCode: true },
              },
            },
          },
        },
      }),
      prisma.resource.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/resources
 * Admin — Upload study PDF to R2 and publish record.
 * Validation handled by Zod middleware.
 */
export const uploadResource = async (req, res, next) => {
  try {
    const { courseId, title, resourceType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF document file is required.',
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, code: true },
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Upload PDF to R2
    const fileKey = `docs/${course.code}/${crypto.randomUUID()}.pdf`;
    await uploadFile(req.file.buffer, fileKey, 'application/pdf');

    // Create resource record
    const resource = await prisma.resource.create({
      data: {
        courseId,
        title,
        resourceType,
        fileKey,
        sizeBytes: req.file.size,
        isPublished: false, // Draft by default
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully (draft). Use /publish to make it public.',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/resources/:id
 * Admin — Update resource title or type.
 * Validation handled by Zod middleware.
 */
export const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, resourceType } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (resourceType !== undefined) updateData.resourceType = resourceType;

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        resourceType: true,
        isPublished: true,
        updatedAt: true,
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully.',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/resources/:id/publish
 * Admin — Toggle isPublished true/false.
 */
export const togglePublish = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { id: true, isPublished: true },
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: { isPublished: !resource.isPublished },
      select: {
        id: true,
        title: true,
        isPublished: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Resource ${updated.isPublished ? 'published' : 'unpublished'} successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/resources/:id
 * Admin — Delete resource record and purge from R2.
 */
export const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { id: true, fileKey: true },
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    // Delete from R2 storage
    await deleteFile(resource.fileKey);

    // Delete from database
    await prisma.resource.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Resource deleted from database and storage.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================

/**
 * GET /api/v1/admin/plans
 * Admin — List all subscription plans (including inactive).
 */
export const listPlans = async (_req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/plans
 * Admin — Create a new subscription plan.
 * Validation handled by Zod middleware.
 */
export const createPlan = async (req, res, next) => {
  try {
    const { name, durationDays, price } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: { name, durationDays, price },
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/plans/:id
 * Admin — Update a subscription plan.
 * Validation handled by Zod middleware.
 */
export const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, durationDays, price, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (durationDays !== undefined) updateData.durationDays = durationDays;
    if (price !== undefined) updateData.price = price;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.subscriptionPlan.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ANALYTICS & SECURITY
// ============================================================

/**
 * GET /api/v1/admin/analytics/stats
 * Admin — Platform metrics.
 */
export const getStats = async (_req, res, next) => {
  try {
    const [totalUsers, activeSubscribers, totalResources, pendingPayments, totalRevenue] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            paymentStatus: 'ACTIVE',
            paidUntil: { gt: new Date() },
          },
        }),
        prisma.resource.count({ where: { isPublished: true } }),
        prisma.user.count({ where: { paymentStatus: 'PENDING_VERIFICATION' } }),
        prisma.payment.aggregate({
          where: { isApproved: true },
          _sum: { amount: true },
        }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeSubscribers,
        totalResources,
        pendingPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/logs/access
 * Admin — View recent document access logs with pagination.
 * Query params: ?page=1&limit=50&userId=xxx
 */
export const getAccessLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.resourceAccessLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { accessedAt: 'desc' },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          accessedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          resource: {
            select: {
              id: true,
              title: true,
              resourceType: true,
            },
          },
        },
      }),
      prisma.resourceAccessLog.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
