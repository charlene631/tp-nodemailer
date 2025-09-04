import fs from "fs";
import path from "path";

// Fonction pure de nettoyage des fichiers locaux vieux de plus de 24h
export const cleanupUploads = () => {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) return;

  const files = fs.readdirSync(uploadDir);
  const now = Date.now();

  files.forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stats = fs.statSync(filePath);
    if ((now - stats.mtimeMs) > 24 * 60 * 60 * 1000) { // > 24h
      fs.unlinkSync(filePath);
      console.log(`Fichier supprimé automatiquement : ${file}`);
    }
  });
};
