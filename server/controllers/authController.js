const { saveData } = require('../models/sample');
const { hashPassword, comparePassword } = require('../utils/authUtils');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const { db } = require('../models/sample');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return res.status(409).json({ error: 'User already exists' });
    const hashed = await hashPassword(password);
    const result = await saveData('users', { email, password: hashed });
    if (result.success) {
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, secure: false });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Smart-CS1',
        text: 'Thank you for signing up!'
      });
      return res.status(201).json({ id: result.id, token });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return res.status(401).json({ error: 'Invalid credentials' });
    const user = snapshot.docs[0].data();
    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: false });
    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login };
