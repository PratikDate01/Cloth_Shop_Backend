const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log full error details in dev or for operational error tracking
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error Handler Caught:', err);
  } else {
    // In production, log a concise summary to stderr without crashing
    console.error(`[API Error] ${req.method} ${req.originalUrl} - ${err.name || 'Error'}: ${err.message}`);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({ success: false, message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
    });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 10MB.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field encountered.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  // CORS Error
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = error.statusCode || 500;
  // In production, avoid leaking unexpected raw stack messages for 500 errors
  const clientMessage =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server. Please try again later.'
      : error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
  });
};

module.exports = errorHandler;
