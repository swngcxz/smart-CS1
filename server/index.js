const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const authRouter = require('./routers/authRouter');
const staffRouter = require('./routers/staffRoutes');
const passport = require('./utils/googleAuth');
const session = require('express-session');
const { saveData } = require('./models/firebase.js');
const scheduleRouter = require("./routers/scheduleRouter");
const truckScheduleRoutes = require("./routers/truckScheduleRoutes");
const binRoutes = require("./routers/binRoutes");
const errorHandler = require("./middlewares/errorHandler");
const activityRoutes = require("./routers/activityRoutes");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api/staff', staffRouter);  
app.use("/api/schedules", scheduleRouter);
app.use("/api/truck-schedules", truckScheduleRoutes);
app.use("/api", binRoutes);
app.use("/api", activityRoutes);

app.use(errorHandler);

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
