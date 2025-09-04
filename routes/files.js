import express from "express";
import { uploadLocal, uploadCloudinary } from "../middlewares/upload.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// --- Upload automatique selon type (image → Cloudinary, autre → local) ---
router.post("/upload", (req, res, next) => {
  const upload = req.file?.mimetype?.startsWith("image/")
    ? uploadCloudinary.single("file")
    : uploadLocal.single("file");

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier envoyé" });

  const isCloud = req.file.path?.includes("res.cloudinary.com");

  res.json({
    success: true,
    storage: isCloud ? "cloudinary" : "local",
    filename: req.file.filename,
    url: isCloud ? req.file.path : `/uploads/${req.file.filename}`
  });
});

// --- Liste fichiers locaux ---
router.get("/local/files", (req, res) => {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) return res.json([]);
  const files = fs.readdirSync(uploadDir).map(name => {
    const stats = fs.statSync(path.join(uploadDir, name));
    return { filename: name, size: stats.size, url: `/uploads/${name}` };
  });
  res.json(files);
});

// --- Suppression fichier local ---
router.delete("/local/:filename", (req, res) => {
  const filePath = path.join(process.cwd(), "uploads", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Fichier non trouvé" });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
