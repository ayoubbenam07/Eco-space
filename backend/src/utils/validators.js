import { z } from 'zod';

// --------------------------------------------------
// Shared field validators
// --------------------------------------------------
const emailField = z.string().email('Please provide a valid email address.');
const passwordField = z.string().min(8, 'Password must be at least 8 characters.');
const phoneField = z.string().regex(/^\+?213[0-9]{9}$/, 'Phone number must be in format: +213XXXXXXXXX (Algerian number).');
const genderField = z.enum(['MALE', 'FEMALE'], { errorMap: () => ({ message: 'Sex must be either MALE or FEMALE.' }) });
const studyLevelField = z.enum(['1CP', '2CP', '1CS', '2CS', '3CS'], {
  errorMap: () => ({ message: 'Study level must be one of: 1CP, 2CP, 1CS, 2CS, 3CS.' }),
});
const resourceTypeField = z.enum(['SUMMARY', 'PRACTICE_EXAM', 'CHEAT_SHEET', 'LECTURE_NOTES'], {
  errorMap: () => ({ message: 'resourceType must be one of: SUMMARY, PRACTICE_EXAM, CHEAT_SHEET, LECTURE_NOTES.' }),
});
const paymentMethodField = z.enum(['BARIDIMOB', 'CCP', 'EDAHABIA_CIB', 'CASH_HAND_TO_HAND'], {
  errorMap: () => ({ message: 'Payment method must be one of: BARIDIMOB, CCP, EDAHABIA_CIB, CASH_HAND_TO_HAND.' }),
});

// --------------------------------------------------
// Auth Schemas
// --------------------------------------------------
export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').transform((v) => v.trim()),
  phoneNumber: phoneField,
  sex: genderField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  newPassword: passwordField,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordField,
});

// --------------------------------------------------
// User Schemas
// --------------------------------------------------
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters.')
      .transform((v) => v.trim())
      .optional(),
    phoneNumber: phoneField.optional(),
    sex: genderField.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field to update is required (fullName, phoneNumber, or sex).',
  });

export const updateAcademicSchema = z
  .object({
    institutionId: z.coerce.number().int().positive().optional(),
    studyLevel: studyLevelField.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field to update is required (institutionId or studyLevel).',
  });

// --------------------------------------------------
// Institution Schemas
// --------------------------------------------------
export const createInstitutionSchema = z.object({
  name: z.string().min(1, 'Name is required.').transform((v) => v.trim()),
  shortCode: z
    .string()
    .min(1, 'shortCode is required.')
    .transform((v) => v.trim().toUpperCase()),
  focus: z.string().transform((v) => v.trim()).optional().nullable(),
  description: z.string().transform((v) => v.trim()).optional().nullable(),
});

export const updateInstitutionSchema = z
  .object({
    name: z.string().min(1).transform((v) => v.trim()).optional(),
    shortCode: z
      .string()
      .min(1)
      .transform((v) => v.trim().toUpperCase())
      .optional(),
    focus: z.string().transform((v) => v.trim()).optional().nullable(),
    description: z.string().transform((v) => v.trim()).optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field to update is required.',
  });

// --------------------------------------------------
// Course Schemas
// --------------------------------------------------
export const createCourseSchema = z.object({
  institutionId: z.coerce.number().int().positive('institutionId is required.'),
  title: z.string().min(1, 'Title is required.').transform((v) => v.trim()),
  code: z
    .string()
    .min(1, 'Code is required.')
    .transform((v) => v.trim().toUpperCase()),
  yearLevel: studyLevelField,
  semester: z.coerce.number().int().min(1).max(2, 'Semester must be 1 or 2.'),
});

export const updateCourseSchema = z
  .object({
    title: z.string().min(1).transform((v) => v.trim()).optional(),
    code: z
      .string()
      .min(1)
      .transform((v) => v.trim().toUpperCase())
      .optional(),
    yearLevel: studyLevelField.optional(),
    semester: z.coerce.number().int().min(1).max(2).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field to update is required.',
  });

// --------------------------------------------------
// Resource Schemas
// --------------------------------------------------
export const uploadResourceSchema = z.object({
  courseId: z.coerce.number().int().positive('courseId is required.'),
  title: z.string().min(1, 'Title is required.').transform((v) => v.trim()),
  resourceType: resourceTypeField,
});

export const updateResourceSchema = z
  .object({
    title: z.string().min(1).transform((v) => v.trim()).optional(),
    resourceType: resourceTypeField.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field to update is required (title or resourceType).',
  });

// --------------------------------------------------
// Payment Schemas
// --------------------------------------------------
export const submitPaymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  method: paymentMethodField,
  planId: z.coerce.number().int().positive().optional(),
});

// --------------------------------------------------
// Subscription Plan Schemas
// --------------------------------------------------
export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required.').transform((v) => v.trim()),
  durationDays: z.coerce.number().int().positive('Duration must be a positive number.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
});

export const updatePlanSchema = z
  .object({
    name: z.string().min(1).transform((v) => v.trim()).optional(),
    durationDays: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field to update is required.',
  });

// --------------------------------------------------
// Pagination Query Schema (reusable)
// --------------------------------------------------
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
