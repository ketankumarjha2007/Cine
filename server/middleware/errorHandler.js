export function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.isPublic ? err.message : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage
    }
  });
}
