// Fallback authentication system for when Firebase quota is exceeded
const jwt = require('jsonwebtoken');

const FALLBACK_USERS = [
  {
    email: 'joshua@gmail.com',
    password: '123swngcxz', // This should be hashed in production
    role: 'admin',
    fullName: 'Josh Canillas'
  },
  {
    email: 'admin@smartbin.com',
    password: 'admin123',
    role: 'admin',
    fullName: 'Admin User'
  }
];

const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";

// Simple password hashing (for demo purposes)
function simpleHash(password) {
  return Buffer.from(password).toString('base64');
}

// Verify password (simple comparison for demo)
function verifyPassword(password, hash) {
  return simpleHash(password) === hash;
}

// Fallback login function
function fallbackLogin(email, password) {
  const user = FALLBACK_USERS.find(u => u.email === email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (!verifyPassword(password, simpleHash(user.password))) {
    return { success: false, error: 'Invalid password' };
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      email: user.email, 
      role: user.role, 
      fullName: user.fullName,
      fallback: true 
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
  
  return {
    success: true,
    user: {
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    token
  };
}

module.exports = {
  fallbackLogin,
  FALLBACK_USERS
};
