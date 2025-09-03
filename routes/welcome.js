// routes/welcome.js
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();
const router = express.Router();

// Validation des données
const welcomeSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required()
});

// Transporteur SMTP (Mailtrap ou Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,       
  port: process.env.MAILTRAP_PORT,       
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  },
  tls: { rejectUnauthorized: false } 
});

// Route POST /api/welcome
router.post('/', async (req, res) => {
  try {
    const { error } = welcomeSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, email } = req.body;

    // Envoi e-mail de bienvenue
    await transporter.sendMail({
      from: `"L'équipe" <${process.env.MAILTRAP_USER}>`, 
      to: email,
      subject: 'Bienvenue dans notre application !',
      text: `Bonjour ${name},\n\nBienvenue dans notre application ! Nous sommes ravis de vous compter parmi nous.`,
      html: `<p>Bonjour <b>${name}</b>,</p><p>Bienvenue dans notre application ! Nous sommes ravis de vous compter parmi nous.</p>`
    });

    res.send('Email de bienvenue envoyé avec succès !');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l’envoi de l’email de bienvenue');
  }
});

export default router;
