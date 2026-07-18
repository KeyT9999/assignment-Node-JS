function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Unique value already exists' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
