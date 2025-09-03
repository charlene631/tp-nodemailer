import express from 'express';
const router = express.Router();

// POST /api/email/welcome
router.post('/welcome', (req, res) => {
  res.send('Route email welcome à implémenter');
});

export default router;
