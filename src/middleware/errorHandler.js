const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Sequelize validation errors
  if (error instanceof ValidationError) {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Sequelize unique constraint errors
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      error: 'DUPLICATE_ENTRY'
    });
  }

  // Sequelize foreign key constraint errors
  if (error instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related record',
      error: 'FOREIGN_KEY_CONSTRAINT'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired'
    });
  }

  // Custom application errors
  if (error.isOperational) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
      error: error.code
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  errorHandler,
  AppError,
  catchAsync
};
