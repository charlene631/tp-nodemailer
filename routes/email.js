import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();
const router = express.Router();

// Validation Joi
const newsletterSchema = Joi.object({
  name: Joi.string().min(2).required(),
  emails: Joi.string().required(), // plusieurs adresses séparées par , ou ;
  content: Joi.string().min(5).required()
});

// Transporteur Mailtrap
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

// Route envoi newsletter
router.post('/', async (req, res) => {
  try {
    const { error } = newsletterSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, emails, content } = req.body;

    // Nettoyage de la liste d'emails
    const recipients = emails
      .split(/[,;]/)
      .map(e => e.trim())
      .filter(e => e);

    if (recipients.length === 0) {
      return res.status(400).send('Aucun destinataire valide.');
    }

    // Envoi unique en BCC
    await transporter.sendMail({
      from: `"${name}" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // destinataire principal fictif pour Mailtrap
      bcc: recipients,             // tous les vrais destinataires ici
      subject: 'Newsletter',
      text: content,
      html: `<p>${content}</p>`
    });

    res.send(`Newsletter envoyée à ${recipients.length} destinataire(s) !`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l’envoi de la newsletter');
  }
});

export default router;
