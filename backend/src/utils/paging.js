function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const size = Math.max(1, Math.min(100, parseInt(req.query.size) || 12));
  const offset = (page - 1) * size;
  
  return { page, size, offset };
}

module.exports = { getPagination };
