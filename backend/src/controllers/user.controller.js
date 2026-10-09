import prisma from '../config/db.js';

/**
 * GET /api/v1/users/profile
 * User — Get detailed user info with institution details.
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        updatedAt: true,
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
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/profile
 * User — Update full name, phone number, or gender.
 * Validation handled by Zod middleware.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, sex } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (sex !== undefined) updateData.sex = sex;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        sex: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/academic
 * User — Update institution ID or current study level.
 * Validation handled by Zod middleware.
 */
export const updateAcademic = async (req, res, next) => {
  try {
    const { institutionId, studyLevel } = req.body;

    const updateData = {};

    if (institutionId !== undefined) {
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
      updateData.institutionId = institutionId;
    }

    if (studyLevel !== undefined) {
      updateData.studyLevel = studyLevel;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        institutionId: true,
        studyLevel: true,
        updatedAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Academic info updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
