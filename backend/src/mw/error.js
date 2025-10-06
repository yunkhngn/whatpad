const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
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
