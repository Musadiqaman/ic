export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message, errors: err.errors });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid id: ${err.value}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate value", keyValue: err.keyValue });
  }
  res.status(err.status || 500).json({ message: err.message || "Server error" });
}
