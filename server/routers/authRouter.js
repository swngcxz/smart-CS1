const express = require('express');

const { signup, login, requestPasswordReset, resetPassword, signout, getCurrentUser, updateCurrentUser } = require('../controllers/authController');
const passport = require('../utils/googleAuth');
const router = express.Router();

// Get current user info
router.get('/me', getCurrentUser);
// Update current user info
router.patch('/me', updateCurrentUser);



router.post('/signup', signup);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/signout', signout);

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
