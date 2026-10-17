import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code,
    errors: err.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string
): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const notFound = (message: string = 'Resource not found') =>
  createError(message, 404, 'NOT_FOUND');

export const badRequest = (message: string = 'Bad request') =>
  createError(message, 400, 'BAD_REQUEST');

export const unauthorized = (message: string = 'Unauthorized') =>
  createError(message, 401, 'UNAUTHORIZED');

export const forbidden = (message: string = 'Forbidden') =>
  createError(message, 403, 'FORBIDDEN');
