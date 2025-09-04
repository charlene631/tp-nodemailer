import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cron from "node-cron";

// Import routes
import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contact.js";
import forgotPasswordRoutes from "./routes/forgotPassword.js";
import resetPasswordRoutes from "./routes/resetPassword.js";
import emailRoutes from "./routes/email.js";
import fileRoutes from "./routes/files.js";
import { cleanupUploads } from "./tasks/cleanup.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json({ limit: "10mb" })); // JSON
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" })); // routes non uploads
app.use(express.static("public")); // Static pour le front

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use("/api/reset-password", resetPasswordRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/contact", contactRoutes);

// Cron
cron.schedule("0 2 * * *", cleanupUploads); // tous les jours à 2h du matin

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
