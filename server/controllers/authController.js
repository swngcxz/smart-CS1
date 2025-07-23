const { db, saveData } = require("../models/firebase");
const { hashPassword, comparePassword } = require("../utils/authUtils");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      console.log("Saving user to Firestore collection: users");
      const docRef = await db.collection("users").add(userData);
      const token = jwt.sign({ email, role: userData.role }, JWT_SECRET, { expiresIn: "1d" });

      res.cookie("token", token, { httpOnly: true, secure: false });

      await transporter.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: email,
        subject: "Welcome to Smart-CS1",
        text: `Thank you for signing up, ${fullName}!`,
      });

      return res.status(201).json({ id: docRef.id, token });
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

  try {
    // find user by email
    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

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
    const token = jwt.sign(
      { email: user.email, logId: logRef.id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false });

    // notify admin
    await transporter.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: "admin@example.com", // replace with actual admin email
      subject: "User Login Notification",
      text: `${user.email} logged in at ${new Date().toLocaleString()}`,
    });

    return res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login };
