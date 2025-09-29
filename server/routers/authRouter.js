const express = require('express');

const { signup, login, requestPasswordReset, resetPassword, signout, getCurrentUser, updateCurrentUser, changePassword, getLoginHistory, getConnectedAccounts, unlinkAccount } = require('../controllers/authController');
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
router.post('/change-password', changePassword);

// Get login history (admin only)
router.get('/login-history', getLoginHistory);

// Connected accounts management
router.get('/connected-accounts', getConnectedAccounts);
router.post('/unlink-account', unlinkAccount);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  async (req, res) => {
    try {
      const googleProfile = req.user;
      
      // Check if user is already logged in (for account linking)
      const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // User is logged in - link Google account
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
        
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const { db, withRetry } = require('../models/firebase');
          
          // Find user by email
          const snapshot = await withRetry(() => db.collection('users').where('email', '==', decoded.email).get());
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            
            // Update user with Google account info
            await withRetry(() => userDoc.ref.update({
              googleId: googleProfile.id,
              googleEmail: googleProfile.emails?.[0]?.value,
              googleName: googleProfile.displayName,
              googlePicture: googleProfile.photos?.[0]?.value,
              updatedAt: new Date().toISOString()
            }));
            
            console.log('Google account linked successfully for user:', decoded.email);
            res.redirect('/admin/settings?linked=google');
          } else {
            res.redirect('/admin/settings?error=user_not_found');
          }
        } catch (jwtError) {
          console.error('JWT verification failed:', jwtError);
          res.redirect('/admin/settings?error=invalid_token');
        }
      } else {
        // User is not logged in - handle as login
        res.send('Google login successful! Please log in to your account first to link Google.');
      }
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/admin/settings?error=callback_failed');
    }
  }
);

module.exports = router;
