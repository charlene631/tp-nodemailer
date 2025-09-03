import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import Joi from 'joi';

const router = express.Router();
const usersPath = path.join('data', 'users.json');
const tokensPath = path.join('data', 'tokens.json');

// Validation
const resetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
});

// POST /api/reset-password
router.post('/', (req, res) => {
  const { error } = resetSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { token, password } = req.body;

  // Lire tokens
  if (!fs.existsSync(tokensPath)) return res.status(400).send('Token invalide');
  let tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
  const tokenObj = tokens.find(t => t.token === token && !t.used && t.expire > Date.now());
  if (!tokenObj) return res.status(400).send('Token invalide ou expiré');

  // Lire utilisateurs et mettre à jour le mot de passe
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const user = users.find(u => u.email === tokenObj.email);
  if (!user) return res.status(400).send('Utilisateur non trouvé');

  user.password = bcrypt.hashSync(password, 10);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  // Marquer token comme utilisé
  tokenObj.used = true;
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));

  res.send('Mot de passe réinitialisé avec succès !');
});

export default router;
