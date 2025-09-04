import express from 'express';
import { uploadLocal, uploadCloudinary } from "../middlewares/upload.js";
import Joi from 'joi';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const router = express.Router();

// Validation avec Joi
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().max(255).trim().required(),
  message: Joi.string().min(5).max(2000).trim().required()
});

// Transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  tls: { rejectUnauthorized: false }
});

// --- Middleware upload automatique (Cloudinary si image, sinon local) ---
function handleUpload(req, res, next) {
  const upload = req.file?.mimetype?.startsWith("image/")
    ? uploadCloudinary.single("file")
    : uploadLocal.single("file");

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}

// --- Route unique POST /api/contact/upload ---
router.post("/upload", handleUpload, async (req, res) => {
  const { error } = contactSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { name, email, message } = req.body;
  const file = req.file;

  const isCloud = file && (
    file.path?.includes("res.cloudinary.com") ||
    file.url?.includes("res.cloudinary.com") ||
    file.secure_url?.includes("res.cloudinary.com")
  );

  try {
    // Envoi mail vers destinataire principal
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      replyTo: email,
      to: process.env.GMAIL_USER,
      subject: `Contact de ${name}`,
      text: `${message}\n\nDe: ${name} <${email}>`,
      html: `<p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
             <p><strong>De:</strong> ${name} &lt;${email}&gt;</p>`,
      attachments: file ? [{
        filename: file.originalname,
        path: isCloud ? (file.path || file.url || file.secure_url) : file.path
      }] : []
    });

    // Accusé de réception au visiteur
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Votre message a bien été reçu",
      text: `Bonjour ${name},\n\nNous avons bien reçu votre message.`,
      html: `<p>Bonjour ${name},</p><p>Nous avons bien reçu votre message.</p>
             <p>Cordialement,<br>L'équipe ${process.env.EMAIL_FROM_NAME}</p>`
    });

    // Nettoyage fichier local si pas Cloudinary
    if (file && !isCloud && file.path) {
      try { fs.unlinkSync(file.path); } catch(e) { console.warn("Erreur cleanup:", e); }
    }

    res.json({
      success: true,
      storage: isCloud ? "cloudinary" : "local",
      filename: file?.originalname,
      url: file ? (isCloud ? (file.path || file.url || file.secure_url) : `/uploads/${file.filename}`) : null
    });

  } catch(err) {
    console.error("Erreur envoi email:", err);

    if (file && !isCloud && file.path) {
      try { fs.unlinkSync(file.path); } catch(e) {}
    }

    res.status(500).json({ success: false, message: "Erreur lors de l'envoi du message" });
  }
});

export default router;
