import express from "express";
import Joi from "joi";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const usersFile = "./data/users.json";

// Validation Joi
const schema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Transporteur Nodemailer (Mailtrap)
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Route POST /register
router.post("/register", async (req, res) => {
  try {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, email, password } = req.body;

    const users = fs.existsSync(usersFile)
      ? JSON.parse(fs.readFileSync(usersFile))
      : [];

    if (users.find((u) => u.email === email)) {
      return res.status(400).send("Email déjà utilisé");
    }

    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(16).toString("hex");
    const tokenExpiry = Date.now() + 15 * 60 * 1000;

    const newUser = {
      name,
      email,
      password: hashed,
      status: "pending",
      token,
      tokenExpiry,
    };

    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    // Mail de validation
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Validation de votre compte",
      html: `<p>Bonjour ${name},</p>
             <p>Merci de vous inscrire. Cliquez sur ce lien pour activer votre compte :</p>
             <a href="http://localhost:3000/api/auth/verify?token=${token}">Activer mon compte</a>
             <p>Ce lien expire dans 15 minutes.</p>`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .send("Erreur lors de l’envoi de l’email de validation");
      }
      res.send("Compte créé. Vérifiez votre email pour activer votre compte.");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

// Route GET /verify?token=xxx
router.get("/verify", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Token manquant");

  const users = fs.existsSync(usersFile)
    ? JSON.parse(fs.readFileSync(usersFile))
    : [];

  const user = users.find((u) => u.token === token);
  if (!user) return res.status(400).send("Token invalide");
  if (user.status === "active") return res.send("Compte déjà activé");
  if (Date.now() > user.tokenExpiry)
    return res.status(400).send("Token expiré");

  user.status = "active";
  user.token = null;
  user.tokenExpiry = null;
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  // Mail de bienvenue après activation
  const welcomeMail = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
    to: user.email,
    subject: "Bienvenue !",
    html: `<p>Bonjour ${user.name},</p>
           <p>Bienvenue dans notre application ! Nous sommes ravis de vous compter parmi nous.</p>`,
  };

  transporter.sendMail(welcomeMail, (err) => {
    if (err) console.error("Erreur envoi mail de bienvenue:", err);
    else console.log("Mail de bienvenue envoyé à", user.email);
  });

  res.send(
    "Compte activé avec succès ! Un email de bienvenue vous a été envoyé."
  );
});

export default router;
