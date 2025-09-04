# structure cloudinary
project/
│
├─ config/
│   └─ cloudinary.js       # configuration Cloudinary
│
├─ middlewares/
│   └─ upload.js           # configuration Multer pour Cloudinary ET stockage local
│
├─ routes/
│   └─ files.js            # endpoints pour upload, liste, suppression
│
├─ uploads/                # dossier local pour stockage des fichiers

npm install express multer multer-storage-cloudinary cloudinary dotenv node-cron

fs et path sont des modules natifs de Node.js

# upload.js (middleware)

Rôle : gérer l’upload des fichiers, local ou Cloudinary.

Tu peux avoir 2 exports dans ce fichier :

uploadLocal → pour stocker sur /uploads sur ton serveur

uploadCloudinary → pour stocker sur Cloudinary

Définir les règles de stockage, taille max, extensions autorisées, etc.

Vérifier les extensions et la taille.

# files.js (route)

Rôle : exposer les endpoints pour gérer les fichiers.

Exemples d’endpoints :

Endpoint	Middleware	Fonction
POST /files/local	uploadLocal.single('file')	Upload local
POST /files/cloudinary	uploadCloudinary.single('file')	Upload Cloudinary
GET /files/local	—	Liste des fichiers locaux
DELETE /files/local/:filename	—	Supprime un fichier local

# La logique professionnelle

Middlewares = gèrent comment le fichier est stocké (upload.js)

Routes fichiers = gèrent les endpoints CRUD des fichiers (files.js)

Routes contact = gèrent formulaire + email, éventuellement avec upload des fichiers

Tâches automatiques = gèrent nettoyage automatique (cleanup.js)

# Projet Node.js / TP Nodemailer + Cloudinary

├─ config/
│   └─ cloudinary.js          # Configuration Cloudinary (clé API, cloud_name)
│
├─ middlewares/
│   └─ upload.js              # Multer + CloudinaryStorage
│                               - export uploadLocal
│                               - export uploadCloudinary
│
├─ routes/
│   ├─ auth.js                # Gestion création compte / login
│   ├─ contact.js             # Formulaire contact
│   │    - Reçoit fichier via multipart/form-data
│   │    - Upload sur Cloudinary + optionnel local
│   │    - Envoi mail avec fichier attaché via Nodemailer
│   ├─ forgotPassword.js
│   ├─ resetPassword.js
│   ├─ email.js                # Newsletter
│   └─ files.js                # Gestion fichiers
│         - POST /local        → Upload local
│         - POST /cloudinary   → Upload Cloudinary
│         - GET /local/files   → Liste fichiers locaux
│         - DELETE /local/:filename → Suppression manuelle
│
├─ tasks/
│   └─ cleanup.js              # Cron pour suppression automatique des fichiers vieux de 1 jour
│
├─ public/
│   └─ index.html              # Formulaires front : contact, newsletter, register, reset password
│
├─ server.js                   # Point d’entrée
│    - dotenv config
│    - body-parser
│    - express.static("public")
│    - routes API : auth, contact, forgot, reset, email, files
│    - cron.schedule() → cleanupUploads
│    - app.listen(PORT)
│
├─ .env                        # Variables d'environnement (Cloudinary, Gmail, etc.)
│
├─ uploads/                     # Dossier local pour fichiers uploadés
│
└─ node_modules/

/config
  cloudinary.js
/middlewares
  upload.js
/routes
  files.js
  contact.js
/tasks
  cleanup.js
/uploads
/signatures
server.js
