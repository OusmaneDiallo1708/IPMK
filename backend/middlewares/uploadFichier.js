const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Dossier de destination
const dossier = path.join(__dirname, '..', 'uploads', 'fichiers');
if (!fs.existsSync(dossier)) {
  fs.mkdirSync(dossier, { recursive: true });
}

// Types MIME autorisés (Excel, Word, PowerPoint, PDF)
const ALLOWED_MIMES = [
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // PDF
  'application/pdf',
];

// Extensions autorisées en secours (si le MIME n'est pas fiable)
const ALLOWED_EXTS = ['.xlsx', '.xls', '.csv', '.docx', '.doc', '.pptx', '.ppt', '.pdf'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dossier),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
                     .replace(/[^a-zA-Z0-9-_]/g, '_')
                     .slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const uploadFichier = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 Mo
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) || ALLOWED_EXTS.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Type de fichier non autorisé. Utilisez Excel, Word, PowerPoint ou PDF.'));
  }
});

module.exports = uploadFichier;