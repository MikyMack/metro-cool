module.exports = function (req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  } else {
    req.session.user = { username: '', isAdmin: true };
    return res.redirect('/admin/login');
  }
};
