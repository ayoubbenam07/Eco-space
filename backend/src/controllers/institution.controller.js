import prisma from '../config/db.js';

/**
 * GET /api/v1/institutions
 * Public — List all Écoles Nationales with optional search and pagination.
 * Query params: ?page=1&limit=20&search=ESI
 */
export const listAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          shortCode: true,
          focus: true,
          description: true,
          _count: {
            select: { courses: true },
          },
        },
      }),
      prisma.institution.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: institutions,
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
 * GET /api/v1/institutions/:id
 * Public — Get specific school details.
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const institution = await prisma.institution.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        name: true,
        shortCode: true,
        focus: true,
        description: true,
        createdAt: true,
        _count: {
          select: { courses: true, users: true },
        },
      },
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: institution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/institutions/:id/courses
 * User — Fetch courses filtered by yearLevel and semester with pagination.
 * Query params: ?yearLevel=1CP&semester=1&page=1&limit=20&search=math
 */
export const getCourses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { yearLevel, semester, page = 1, limit = 20, search } = req.query;

    // Verify institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: parseInt(id, 10) },
      select: { id: true },
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.',
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = { institutionId: parseInt(id, 10) };
    if (yearLevel) where.yearLevel = yearLevel;
    if (semester) where.semester = parseInt(semester, 10);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }, { title: 'asc' }],
        select: {
          id: true,
          title: true,
          code: true,
          yearLevel: true,
          semester: true,
          _count: {
            select: { resources: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
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
