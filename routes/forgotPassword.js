import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();
const router = express.Router();

// Lecture et écriture des utilisateurs
const usersPath = path.join('data', 'users.json');
const tokensPath = path.join('data', 'tokens.json');

// Validation email
const emailSchema = Joi.object({
  email: Joi.string().email().required()
});

// Transporteur Nodemailer
//const transporter = nodemailer.createTransport({
  //service: 'gmail',
  //auth: {
    //user: process.env.GMAIL_USER,
    //pass: process.env.GMAIL_APP_PASSWORD
  //},
  //tls: { rejectUnauthorized: false }
//});

// Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// POST /api/forgot-password
router.post('/', async (req, res) => {
  const { error } = emailSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { email } = req.body;

  // Charger les utilisateurs
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const user = users.find(u => u.email === email);
  if (!user) return res.send('Si cet email existe, un lien a été envoyé.'); // ne pas révéler

  // Générer token
  const token = crypto.randomBytes(20).toString('hex');
  const expire = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Sauver token
  let tokens = [];
  if (fs.existsSync(tokensPath)) {
    tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
  }
  tokens.push({ email, token, expire, used: false });
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));

  // Envoyer le mail
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
    html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><a href="${resetLink}">${resetLink}</a>`
  });

  res.send('Si cet email existe, un lien a été envoyé.');
});

export default router;
