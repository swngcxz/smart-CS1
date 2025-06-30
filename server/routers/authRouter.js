const express = require('express');
const { signup, login } = require('../controllers/authController');
const passport = require('../utils/googleAuth');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    // Successful authentication
    res.send('Google login successful!');
  }
);

module.exports = router;
