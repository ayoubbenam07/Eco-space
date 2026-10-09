import { ZodError } from 'zod';

/**
 * Validation Middleware Factory
 * Takes a Zod schema and returns Express middleware that validates req.body.
 * On failure, returns 400 with structured error messages.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of the request to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req[source]);
      // Replace with parsed/transformed values
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message);
        return res.status(400).json({
          success: false,
          message: messages.length === 1 ? messages[0] : 'Validation failed.',
          errors: messages,
        });
      }
      next(error);
    }
  };
};
