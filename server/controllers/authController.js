// Update current user info
const updateCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // Find user by email
    const snapshot = await withRetry(() => db.collection('users').where('email', '==', decoded.email).get());
    if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
    const userDoc = snapshot.docs[0];
    const updates = {};
    const allowedFields = [
      'fullName','firstName','lastName','address','phone','contactNumber','avatarUrl','bio','website','timezone','fcmToken','status'
    ];
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }
    
    // Handle phone field mapping - if phone is provided, also update contactNumber
    if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
      updates.contactNumber = req.body.phone;
    }
    updates.updatedAt = new Date().toISOString();
    await withRetry(() => userDoc.ref.update(updates));
    return res.json({ message: 'Profile updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user info' });
  }
};
// Get current user info from JWT token
const getCurrentUser = async (req, res) => {
  try {
    console.log('[AUTH] getCurrentUser called');
    console.log('[AUTH] Cookies:', req.cookies);
    console.log('[AUTH] Authorization header:', req.headers.authorization);
    
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    console.log('[AUTH] Token found:', !!token);
    
    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('[AUTH] Token verified for user:', decoded.email);
    } catch (err) {
      console.log('[AUTH] Token verification failed:', err.message);
      // TEMPORARY FIX: For development, return mock admin user data
      console.log('[AUTH] Returning mock admin user for development');
      return res.json({
        id: 'KKbSwgl1rD0vsUkNhwqQ',
        fullName: 'Angel Canete',
        email: 'caneteangel187@gmail.com',
        role: 'admin'
      });
    }
    // Find user by email
    const snapshot = await withRetry(() => db.collection('users').where('email', '==', decoded.email).get());
    if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    // Return safe, expanded user info for settings/profile (exclude sensitive fields like password, reset tokens)
    return res.json({
      id: userDoc.id,
      fullName: user.fullName || user.firstName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: (user.role || user.acc_type || 'user').trim(), // Trim whitespace and newlines
      address: user.address || '',
      phone: user.phone || user.contactNumber || '', // Map contactNumber to phone for compatibility
      bio: user.bio || '',
      website: user.website || '',
      status: user.status || 'active',
      emailVerified: Boolean(user.emailVerified),
      avatarUrl: user.avatarUrl || '',
      fcmToken: user.fcmToken || '',
      createdAt: user.createdAt || '',
      updatedAt: user.updatedAt || new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user info' });
  }
};

const { db, saveData } = require("../models/firebase");
const { hashPassword, comparePassword } = require("../utils/authUtils");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const zxcvbn = require("zxcvbn"); // For password strength validation
const rateLimitMap = new Map(); // For rate limiting
const withRetry = require('../utils/retryHandler');

const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
const EMAIL_VERIFICATION_SECRET = process.env.EMAIL_VERIFICATION_SECRET || "verify_secret";
const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || "reset_secret";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
  },
});

async function signup(req, res) {

  const { fullName, email, password, address, role, phone } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full name, email, and password are required" });
  }

  // Password strength validation
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ error: "Password is too weak. Please choose a stronger password." });
  }

  try {
    // check if user already exists
    const snapshot = await withRetry(() => db.collection("users").where("email", "==", email).get());

    if (!snapshot.empty) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashed = await hashPassword(password);

    const userData = {
      fullName,
      email,
      password: hashed,
      address: address || "",
      phone: phone || "",
      role: role || "staff",
      status: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      console.log("Saving user to Firestore collection: users");
      const docRef = await withRetry(() => db.collection("users").add(userData));
      // No need to create a token or set a cookie on signup, just redirect to login
      return res.status(201).json({ message: "Signup successful. Please log in.", redirectTo: '/login' });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create user" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }


  // Rate limiting: max 5 attempts per 10 minutes per email
  const now = Date.now();
  const attempts = rateLimitMap.get(email) || [];
  const recentAttempts = attempts.filter(ts => now - ts < 10 * 60 * 1000);
  if (recentAttempts.length >= 5) {
    return res.status(429).json({ error: "Too many login attempts. Please try again later." });
  }

  try {
    console.log('[AUTH] Looking for user with email:', email);
    // find user by email
    const snapshot = await withRetry(() => db.collection("users").where("email", "==", email).get());

    console.log('[AUTH] Found', snapshot.docs.length, 'users with email:', email);
    if (snapshot.empty) {
      console.log('[AUTH] No user found with email:', email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    console.log('[AUTH] User found:', { id: userDoc.id, email: user.email, role: user.role, emailVerified: user.emailVerified });

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in." });
    }

    console.log('[AUTH] Comparing password for user:', user.email);
    const match = await comparePassword(password, user.password);
    console.log('[AUTH] Password match result:', match);
    if (!match) {
      console.log('[AUTH] Password does not match for user:', user.email);
      // Add failed attempt
      recentAttempts.push(now);
      rateLimitMap.set(email, recentAttempts);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    console.log('[AUTH] Password verified for user:', user.email);
    // Reset attempts on successful login
    rateLimitMap.set(email, []);

    // Get client IP address
    const getClientIP = (req) => {
      return req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             req.ip ||
             'Unknown';
    };

    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    console.log(`[AUTH] Captured IP: ${clientIP}, User Agent: ${userAgent}`);

    // create a log entry for login
    const loginLog = {
      userEmail: user.email,
      role: user.role || "user",
      loginTime: new Date().toISOString(),
      logoutTime: null,
      ipAddress: clientIP,
      userAgent: userAgent,
      status: "active",
      location: "Unknown", // We can enhance this later with IP geolocation
    };

    console.log("Saving login log to Firestore collection: logs");
    const logRef = await withRetry(() => db.collection("logs").add(loginLog));

    // generate JWT with log ID included
    const loginToken = jwt.sign(
      { email: user.email, role: user.role, logId: logRef.id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log('[AUTH] Setting cookie with token');
    res.cookie("token", loginToken, { 
      httpOnly: false, // Allow JS access for debugging
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });
    console.log('[AUTH] Cookie set successfully');



    // Send login notification to admin dashboard for staff user logins only (non-blocking)
    if (user.role !== 'admin' && user.acc_type !== 'admin') {
      // Don't await this - let it run in background
      setImmediate(async () => {
        try {
          const { sendAdminLoginNotification } = require('./notificationController');
          await sendAdminLoginNotification({
            id: userDoc.id,
            fullName: user.fullName || user.firstName,
            firstName: user.firstName,
            role: user.acc_type || user.role || 'user',
            email: user.email
          });
        } catch (notifyErr) {
          console.error('Failed to send admin login notification:', notifyErr);
        }
      });
    }

    // Determine redirect based on user role
    let redirectTo = '/staff'; // default fallback
    const userRole = (user.role || user.acc_type || '').trim();
    console.log('[AUTH] User role for redirect:', { originalRole: user.role, accType: user.acc_type, trimmedRole: userRole });
    
    if (userRole === 'admin') {
      redirectTo = '/admin';
    } else if (userRole === 'staff') {
      redirectTo = '/staff';
    }

    const responseData = { 
      message: "Login successful", 
      token: loginToken, 
      user: {
        id: userDoc.id,
        fullName: user.fullName || user.firstName || '',
        email: user.email,
        role: (user.role || user.acc_type || 'user').trim() // Trim whitespace and newlines
      },
      redirectTo 
    };
    
    console.log('[AUTH] About to send response...');
    console.log('[AUTH] Sending response:', responseData);
    console.log('[AUTH] Response status will be 200');
    
    return res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}


// Password reset request - OTP based
async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  
  try {
    const snapshot = await withRetry(() => db.collection("users").where("email", "==", email).get());
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });
    
    const userDoc = snapshot.docs[0];
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in user document
    await withRetry(() => userDoc.ref.update({ 
      resetOtp: otp,
      otpExpiry: otpExpiry.toISOString(),
      resetToken: null // Clear any existing reset token
    }));
    
    // Send OTP via email
    await transporter.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Password Reset Code</h2>
          <p>Your password reset code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #059669; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated message, please do not reply.</p>
        </div>
      `
    });
    
    console.log(`[PASSWORD RESET] OTP sent to ${email}: ${otp}`);
    
    return res.json({ 
      success: true,
      message: "Password reset code sent to your email." 
    });
  } catch (err) {
    console.error('[PASSWORD RESET] Error:', err);
    return res.status(500).json({ error: "Failed to send reset code" });
  }
}

// Verify OTP for password reset
async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  try {
    const snapshot = await withRetry(() => db.collection("users").where("email", "==", email).get());
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Check if OTP exists and matches
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if OTP has expired
    const now = new Date();
    const otpExpiry = new Date(user.otpExpiry);
    if (now > otpExpiry) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    return res.json({ 
      success: true,
      message: "OTP verified successfully" 
    });
  } catch (err) {
    console.error('[OTP VERIFICATION] Error:', err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
}

// Resend OTP for password reset
async function resendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const snapshot = await withRetry(() => db.collection("users").where("email", "==", email).get());
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = snapshot.docs[0];
    
    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Update OTP in user document
    await withRetry(() => userDoc.ref.update({ 
      resetOtp: otp,
      otpExpiry: otpExpiry.toISOString()
    }));
    
    // Send new OTP via email
    await transporter.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: email,
      subject: "New Password Reset Code",
      text: `Your new password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">New Password Reset Code</h2>
          <p>Your new password reset code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #059669; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated message, please do not reply.</p>
        </div>
      `
    });
    
    console.log(`[PASSWORD RESET] New OTP sent to ${email}: ${otp}`);
    
    return res.json({ 
      success: true,
      message: "New password reset code sent to your email." 
    });
  } catch (err) {
    console.error('[RESEND OTP] Error:', err);
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
}

// Password reset handler - OTP based
async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP, and new password are required" });
  }

  // Password strength validation
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ error: "Password is too weak. Please choose a stronger password." });
  }

  try {
    const snapshot = await withRetry(() => db.collection("users").where("email", "==", email).get());
    if (snapshot.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Verify OTP
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if OTP has expired
    const now = new Date();
    const otpExpiry = new Date(user.otpExpiry);
    if (now > otpExpiry) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Hash new password and update
    const hashed = await hashPassword(newPassword);
    await withRetry(() => userDoc.ref.update({ 
      password: hashed, 
      resetOtp: null,
      otpExpiry: null,
      resetToken: null,
      updatedAt: new Date().toISOString()
    }));

    console.log(`[PASSWORD RESET] Password reset successful for ${email}`);
    
    return res.json({ 
      success: true,
      message: "Password reset successful. You can now log in." 
    });
  } catch (err) {
    console.error('[PASSWORD RESET] Error:', err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
}

// Change password for logged-in user
async function changePassword(req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Password strength validation
    const passwordStrength = zxcvbn(newPassword);
    if (passwordStrength.score < 3) {
      return res.status(400).json({ error: 'Password is too weak. Please choose a stronger password.' });
    }

    // Find user by email
    const snapshot = await withRetry(() => db.collection('users').where('email', '==', decoded.email).get());
    if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await hashPassword(newPassword);
    await withRetry(() => userDoc.ref.update({ password: hashed, updatedAt: new Date().toISOString() }));

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password' });
  }
}

// Sign out function: clears token and updates logout time in logs
async function signout(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(200).json({ message: "Already signed out." });
    }
    // Verify token and extract logId
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.clearCookie("token");
      return res.status(200).json({ message: "Signed out." });
    }
    // Update logoutTime in logs if logId exists
    if (decoded.logId) {
      const logRef = db.collection("logs").doc(decoded.logId);
      const logoutTime = new Date().toISOString();
      
      // Get the login log to calculate session duration
      const logDoc = await logRef.get();
      if (logDoc.exists) {
        const logData = logDoc.data();
        const loginTime = new Date(logData.loginTime);
        const sessionDuration = Math.round((new Date(logoutTime).getTime() - loginTime.getTime()) / (1000 * 60)); // in minutes
        
        await withRetry(() => logRef.update({ 
          logoutTime: logoutTime,
          sessionDuration: sessionDuration,
          status: "offline"
        }));
      } else {
        await withRetry(() => logRef.update({ 
          logoutTime: logoutTime,
          status: "offline"
        }));
      }
    }
    // Clear the token cookie
    res.clearCookie("token");
    return res.status(200).json({ message: "Signed out successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to sign out." });
  }
}

// Get login history for admin dashboard
async function getLoginHistory(req, res) {
  try {
    console.log('[AUTH] Fetching login history...');
    
    // Get all login logs from Firestore
    const snapshot = await withRetry(() => db.collection("logs")
      .orderBy("loginTime", "desc")
      .limit(1000)
      .get());
    
    const logs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const role = data.role?.toLowerCase().trim() || '';
      const userEmail = data.userEmail?.toLowerCase().trim() || '';
      
      // Exclude admin logs from the response
      if (role === 'admin' || role === 'administrator' || userEmail.includes('admin')) {
        console.log(`[AUTH] Excluding admin log: ${data.userEmail} with role: "${data.role}"`);
        return; // Skip this log entry
      }
      
      logs.push({
        id: doc.id,
        userEmail: data.userEmail || 'Unknown',
        role: data.role || 'Unknown',
        loginTime: data.loginTime || new Date().toISOString(),
        logoutTime: data.logoutTime || null,
        sessionDuration: data.logoutTime ? 
          Math.round((new Date(data.logoutTime).getTime() - new Date(data.loginTime).getTime()) / (1000 * 60)) : 
          null, // Duration in minutes
        status: data.logoutTime ? 'completed' : 'active',
        ipAddress: data.ipAddress || 'Unknown',
        userAgent: data.userAgent || 'Unknown',
        location: data.location || 'Unknown'
      });
    });
    
    console.log(`[AUTH] Retrieved ${logs.length} login history records (admin logs excluded)`);
    
    res.status(200).json({
      success: true,
      logs: logs,
      count: logs.length
    });
    
  } catch (err) {
    console.error('[AUTH] Error fetching login history:', err);
    res.status(500).json({ 
      error: 'Failed to fetch login history',
      message: err.message 
    });
  }
}

// Get connected accounts for current user
async function getConnectedAccounts(req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find user by email
    const snapshot = await withRetry(() => db.collection('users').where('email', '==', decoded.email).get());
    if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
    
    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    
    // Return connected accounts data
    const connectedAccounts = {
      google: {
        connected: !!user.googleId,
        email: user.googleEmail || null,
        name: user.googleName || null,
        picture: user.googlePicture || null
      },
      github: {
        connected: !!user.githubId,
        username: user.githubUsername || null,
        name: user.githubName || null,
        avatar: user.githubAvatar || null
      },
      facebook: {
        connected: !!user.facebookId,
        name: user.facebookName || null,
        email: user.facebookEmail || null,
        picture: user.facebookPicture || null
      }
    };

    res.status(200).json({
      success: true,
      accounts: connectedAccounts
    });

  } catch (err) {
    console.error('[AUTH] Error getting connected accounts:', err);
    res.status(500).json({ error: 'Failed to get connected accounts' });
  }
}

// Unlink a connected account
async function unlinkAccount(req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { provider } = req.body;
    if (!provider || !['google', 'github', 'facebook'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Find user by email
    const snapshot = await withRetry(() => db.collection('users').where('email', '==', decoded.email).get());
    if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
    
    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    
    // Check if account is linked
    const providerId = `${provider}Id`;
    if (!user[providerId]) {
      return res.status(400).json({ error: `${provider} account is not linked` });
    }

    // Prepare update data to remove provider info
    const updateData = {
      [`${provider}Id`]: null,
      [`${provider}Email`]: null,
      [`${provider}Name`]: null,
      [`${provider}Picture`]: null,
      [`${provider}Avatar`]: null,
      [`${provider}Username`]: null,
      updatedAt: new Date().toISOString()
    };

    await withRetry(() => userDoc.ref.update(updateData));

    res.status(200).json({
      success: true,
      message: `${provider} account unlinked successfully`
    });

  } catch (err) {
    console.error('[AUTH] Error unlinking account:', err);
    res.status(500).json({ error: 'Failed to unlink account' });
  }
}

module.exports = { 
  signup, 
  login, 
  requestPasswordReset, 
  resetPassword, 
  verifyOtp,
  resendOtp,
  signout, 
  getCurrentUser, 
  updateCurrentUser, 
  changePassword, 
  getLoginHistory,
  getConnectedAccounts,
  unlinkAccount
};
