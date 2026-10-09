import prisma from '../config/db.js';
import { getFileBuffer } from './storage.service.js';
import { watermarkPdf } from '../utils/watermarkPdf.js';

/**
 * Fetch resource metadata (no file content).
 */
export async function getResourceMeta(resourceId) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      title: true,
      resourceType: true,
      sizeBytes: true,
      isPublished: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          yearLevel: true,
          semester: true,
          institution: {
            select: {
              id: true,
              name: true,
              shortCode: true,
            },
          },
        },
      },
    },
  });

  if (!resource) {
    const error = new Error('Resource not found.');
    error.statusCode = 404;
    throw error;
  }

  return resource;
}

/**
 * Fetch PDF from R2, watermark it with user info, log the access,
 * and return the watermarked buffer.
 */
export async function streamWatermarkedPdf(resourceId, user, ipAddress) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      fileKey: true,
      isPublished: true,
      title: true,
    },
  });

  if (!resource) {
    const error = new Error('Resource not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!resource.isPublished) {
    const error = new Error('This resource is not yet published.');
    error.statusCode = 403;
    throw error;
  }

  // Fetch the original PDF from R2
  const pdfBuffer = await getFileBuffer(resource.fileKey);

  // Watermark with user identity
  const watermarkedPdf = await watermarkPdf(pdfBuffer, {
    email: user.email,
    phoneNumber: user.phoneNumber,
    ipAddress,
  });

  // Log the access for analytics & rate limiting
  await prisma.resourceAccessLog.create({
    data: {
      userId: user.id,
      resourceId: resource.id,
      ipAddress,
      userAgent: null, // Set by controller if available
    },
  });

  return {
    buffer: Buffer.from(watermarkedPdf),
    title: resource.title,
  };
}
