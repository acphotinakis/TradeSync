import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validateRequest = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(400, `Validation error: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };

// Validation schemas
export const orderSchema = z.object({
  symbol: z.string().min(1).max(10),
  type: z.enum(['market', 'limit']),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  price: z.number().positive().optional(),
});

export const portfolioSchema = z.object({
  userId: z.string().optional(),
});