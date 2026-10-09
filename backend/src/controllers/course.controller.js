import prisma from '../config/db.js';

/**
 * GET /api/v1/courses/:id
 * User — Get course details with institution info.
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        title: true,
        code: true,
        yearLevel: true,
        semester: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
        _count: {
          select: { resources: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:id/resources
 * User — List published resources for a course with pagination.
 * Query params: ?page=1&limit=20&search=chapitre&type=SUMMARY
 */
export const getResources = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, search, type } = req.query;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id, 10) },
      select: { id: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      courseId: parseInt(id, 10),
      isPublished: true,
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (type) {
      where.resourceType = type;
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
          createdAt: true,
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
