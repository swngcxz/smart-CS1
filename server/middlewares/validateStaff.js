function validateStaff(req, res, next) {
  const { fullName, role, email } = req.body;
  if (!fullName || !role || !email) {
    return res.status(400).json({ error: 'Missing required fields (fullName, role, email)' });
  }
  next();
}


module.exports = validateStaff;
