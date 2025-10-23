function checkSession(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    const err = new Error("Unauthorized. Please login first.");
    err.status = 401;
    next(err);
  }
}

module.exports = checkSession;
