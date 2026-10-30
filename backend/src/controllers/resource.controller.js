import prisma from '../config/db.js';
import * as resourceService from '../services/resource.service.js';

/**
 * POST /api/v1/resources/validate
 * Authenticated — Validate if a list of resource IDs still exist (and are published if user is not admin).
 * Used by frontend to clean up stale/deleted items in "Recently Viewed".
 */
export const validateResources = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(200).json({
        success: true,
        data: { existingIds: [] },
      });
    }

    const safeIds = ids.filter((id) => typeof id === 'string').slice(0, 50);

    const where = {
      id: { in: safeIds },
    };

    if (!req.user?.isAdmin) {
      where.isPublished = true;
    }

    const existing = await prisma.resource.findMany({
      where,
      select: { id: true },
    });

    res.status(200).json({
      success: true,
      data: { existingIds: existing.map((r) => r.id) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/resources/:id
 * User (Active Sub) — Fetch resource metadata.
 */
export const getMeta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resource = await resourceService.getResourceMeta(id);

    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/resources/:id/stream
 * User (Active Sub + Rate Limit) — Stream watermarked PDF.
 * The PDF is stamped with the user's email, phone, and IP address
 * to deter unauthorized redistribution.
 */
export const stream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    const { buffer, title } = await resourceService.streamWatermarkedPdf(
      id,
      req.user,
      ipAddress
    );

    // Sanitize title for Content-Disposition header
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-. ]/g, '_');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeTitle}.pdf"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
