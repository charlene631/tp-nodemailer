import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

// --- Upload local ---
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});

const uploadLocal = multer({
  storage: localStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 Mo
});

// --- Upload Cloudinary ---
const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Documents",
    allowed_formats: ["jpg","png","jpeg","gif","webp","avif","pdf","txt","docx"],
  },
});

const uploadCloudinary = multer({
  storage: cloudStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

// **EXPORTS**
export { uploadLocal, uploadCloudinary };
