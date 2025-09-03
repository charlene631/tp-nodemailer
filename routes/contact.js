import express from 'express';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import upload from '../middlewares/upload.js';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const router = express.Router();

// Validation Joi
const contactSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  message: Joi.string().min(5).required()
});

// Transporteur Nodemailer Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, email, message } = req.body;
    const file = req.file;

    // Vérification extension
    if (file) {
      const allowedExt = ['.pdf', '.jpg', '.png'];
      if (!allowedExt.includes(path.extname(file.originalname).toLowerCase())) {
        fs.unlinkSync(file.path); // supprime le fichier si invalide
        return res.status(400).send('Extension de fichier non autorisée');
      }
    }

    // Mail vers destinataire principal
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.GMAIL_USER, // destinataire défini dans .env
      subject: `Formulaire de contact de ${name}`,
      text: `${message}\n\nDe : ${name} <${email}>`,
      attachments: file ? [{ filename: file.originalname, path: file.path }] : []
    };
    await transporter.sendMail(mailOptions);

    // Accusé de réception au visiteur
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Votre message a bien été reçu',
      text: `Bonjour ${name},\n\nNous avons bien reçu votre message. Merci !`,
      html: `<p>Bonjour ${name},</p><p>Nous avons bien reçu votre message. Merci !</p>`
    });

    res.send('Message envoyé avec succès !');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

export default router;
