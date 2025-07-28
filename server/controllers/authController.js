
const { db, saveData } = require("../models/firebase");
const { hashPassword, comparePassword } = require("../utils/authUtils");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const rateLimitMap = new Map(); // For rate limiting

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

  const { fullName, email, password, address, role } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full name, email, and password are required" });
  }

  try {
    // check if user already exists
    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (!snapshot.empty) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashed = await hashPassword(password);


    const userData = {
      fullName,
      email,
      password: hashed,
      address: address || "",
      role: role || "user",
      status: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      console.log("Saving user to Firestore collection: users");
      const docRef = await db.collection("users").add(userData);
      const token = jwt.sign({ email, role: userData.role }, JWT_SECRET, { expiresIn: "1d" });

      res.cookie("token", token, { httpOnly: true, secure: false });

      return res.status(201).json({ id: docRef.id, message: "Signup successful." });
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
    // find user by email
    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in." });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      // Add failed attempt
      recentAttempts.push(now);
      rateLimitMap.set(email, recentAttempts);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Reset attempts on successful login
    rateLimitMap.set(email, []);

    // create a log entry for login
    const loginLog = {
      userEmail: user.email,
      role: user.role || "user",
      loginTime: new Date().toISOString(),
      logoutTime: null,
    };

    console.log("Saving login log to Firestore collection: logs");
    const logRef = await db.collection("logs").add(loginLog);

    // generate JWT with log ID included
    const loginToken = jwt.sign(
      { email: user.email, logId: logRef.id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", loginToken, { httpOnly: true, secure: false });

    // notify admin
    await transporter.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: "admin@example.com", // replace with actual admin email
      subject: "User Login Notification",
      text: `${user.email} logged in at ${new Date().toLocaleString()}`,
    });

    return res.status(200).json({ message: "Login successful", token: loginToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}


// Password reset request
async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const snapshot = await db.collection("users").where("email", "==", email).get();
  if (snapshot.empty) return res.status(404).json({ error: "User not found" });
  const userDoc = snapshot.docs[0];
  const resetToken = jwt.sign({ email }, PASSWORD_RESET_SECRET, { expiresIn: "1h" });
  await userDoc.ref.update({ resetToken });
  const resetUrl = `${req.protocol}://${req.get("host")}/auth/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    to: email,
    subject: "Password Reset Request",
    text: `Reset your password using this link: ${resetUrl}`,
  });
  return res.json({ message: "Password reset email sent." });
}

// Password reset handler
async function resetPassword(req, res) {
  const { token: resetToken } = req.query;
  const { newPassword } = req.body;
  if (!resetToken || !newPassword) return res.status(400).json({ error: "Missing token or new password" });
  try {
    const decoded = jwt.verify(resetToken, PASSWORD_RESET_SECRET);
    const snapshot = await db.collection("users").where("email", "==", decoded.email).get();
    if (snapshot.empty) return res.status(400).json({ error: "Invalid token" });
    const userDoc = snapshot.docs[0];
    const hashed = await hashPassword(newPassword);
    await userDoc.ref.update({ password: hashed, resetToken: null });
    return res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }
}

module.exports = { signup, login, requestPasswordReset, resetPassword };
