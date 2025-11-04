const errorHandler = (err, req, res, next) => {
  console.error('=== ERROR HANDLER ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error code:', err.code);
  console.error('Error field:', err.field);
  console.error('Full error:', err);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        message: 'File too large. Maximum size is 5MB',
        errorCode: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        ok: false,
        message: `Unexpected field '${err.field}'. Expected field name is 'image'`,
        errorCode: 'UNEXPECTED_FIELD'
      });
    }
  }
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  
  res.status(status).json({
    ok: false,
    message,
    errorCode
  });
};

module.exports = errorHandler;
