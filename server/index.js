const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const authRouter = require('./routers/authRouter');
const passport = require('./utils/googleAuth');
const session = require('express-session');
const { saveData } = require('./models/sample');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());

// Add session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Mount authentication routes
app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('API is running'); 
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.send('Google login successful!');
  }
);

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  const result = await saveData('testCollection', { test: 'hello', time: Date.now() });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
