const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// Debugging: check if .env variables are loaded correctly
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("❌ Google OAuth credentials are missing. Check your .env file!");
} else {
  console.log("✅ Google Client ID loaded:", process.env.GOOGLE_CLIENT_ID);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // This callback runs after successful authentication
      console.log("👉 Google profile received:", profile.displayName);
      return done(null, profile);
    }
  )
);

// Store user in session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Retrieve user from session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

module.exports = passport;
