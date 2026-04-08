/**
 * Error Handling Middleware
 * Catches and formats all application errors
 */

export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  
  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map(err => err.message)
      .join(', ');
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern)[0];
    message = field === 'hash' 
      ? 'A duplicate legacy hash index blocked this upload. Restart the backend so the index migration can run, then try again.'
      : `${field} already exists`;
  }
  
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

/**
 * 404 Handler - Catch undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

export default {
  errorHandler,
  notFoundHandler
};
