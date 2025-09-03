import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// Import routes
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contact.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import resetPasswordRoutes from './routes/resetPassword.js';
import emailRoutes from './routes/email.js';
import welcomeRoutes from './routes/welcome.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static folder pour front
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/reset-password', resetPasswordRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/welcome', welcomeRoutes);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
