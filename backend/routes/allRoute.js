const router = require('express').Router();
const path = require('path');
const multer = require("multer");
const { requireAuth, requireRole } = require('../middlewares/requireAuth');

// ==================== IMPORTS DES CONTRÔLEURS ====================
const etudiantController = require('../controllers/etudiantController');
const inscriptionController = require('../controllers/inscriptionController');
const utilisateurController = require('../controllers/utilisateurController');
const enseignantController = require('../controllers/enseignantsController');
const noteController = require('../controllers/noteController');
const paiementController = require('../controllers/paiementController');
const fichierController = require('../controllers/fichierController');   // 🆕 AJOUT

// ==================== MULTER : PHOTOS UTILISATEURS ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/user/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadUser = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Seules les images sont autorisées (JPEG, JPG, PNG)'));
    }
});

// ==================== MULTER : PHOTOS ÉTUDIANTS ====================
const storageEtudiant = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/etudiants/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `etudiant-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadEtudiant = multer({
    storage: storageEtudiant,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Seules les images sont autorisées (JPEG, JPG, PNG)'));
    }
});

// ==================== MULTER : CV ENSEIGNANTS ====================
const storageCvEnseignant = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/cv/';
        const fs = require('fs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadCvEnseignant = multer({
    storage: storageCvEnseignant,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error('Seuls les fichiers PDF, DOC, DOCX sont autorisés'));
    }
});

// ==================== MULTER : FICHIERS (EXCEL, WORD, PPT, PDF) ==================== 🆕 AJOUT
const storageFichier = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/fichiers/';
        const fs = require('fs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path.basename(file.originalname, ext)
                         .replace(/[^a-zA-Z0-9-_]/g, '_')
                         .slice(0, 40);
        cb(null, `${Date.now()}_${base}${ext}`);
    }
});

const ALLOWED_FICHIER_MIMES = [
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
    'application/pdf'
];
const ALLOWED_FICHIER_EXTS = ['.xlsx', '.xls', '.csv', '.docx', '.doc', '.pptx', '.ppt', '.pdf'];

const uploadFichier = multer({
    storage: storageFichier,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_FICHIER_MIMES.includes(file.mimetype) || ALLOWED_FICHIER_EXTS.includes(ext)) {
            return cb(null, true);
        }
        cb(new Error('Type de fichier non autorisé. Utilisez Excel, Word, PowerPoint ou PDF.'));
    }
});
// 🆕 FIN AJOUT MULTER FICHIERS

// ==================== ROUTE TEST ====================
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'API fonctionne' });
});

// ==================================================
// ================= ROUTES UTILISATEURS ============
// ==================================================
router.post('/utilisateur/ajoutUtilisateur', uploadUser.single('photo'), utilisateurController.ajoutUtilisateur);
router.get('/utilisateur/getAllUtilisateurs', utilisateurController.afficherTousLesUtilisateurs);
router.get('/utilisateur/getUtilisateur/:id', utilisateurController.afficherUnUtilisateur);
router.put('/utilisateur/modifierUtilisateur/:id', requireAuth, uploadUser.single('photo'), utilisateurController.modifierUnUtilisateur);
router.delete('/utilisateur/supprimerUtilisateur/:id', requireAuth, utilisateurController.supprimerUnUtilisateur);
router.put('/utilisateur/activerUtilisateur/:id', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.activerUtilisateur);
router.put('/utilisateur/desactiverUtilisateur/:id', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.desactiverUtilisateur);
router.put('/utilisateur/modifierRole/:id', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.modifierRoleUtilisateur);
router.get('/utilisateur/utilisateursEnAttente', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.getUtilisateursEnAttente);

// ==================================================
// ============ ✅ ROUTES ÉTUDIANTS =================
// ==================================================
router.post('/etudiant/login', etudiantController.login);

router.get('/etudiant/profil', requireAuth, (req, res) => {
    const etudiant = req.user.toObject();
    delete etudiant.motDePasse;
    res.status(200).json({ success: true, etudiant });
});

router.get('/etudiant/tous',       requireAuth, requireRole(['admin', 'superAdmin','Comptable']), etudiantController.getAllEtudiants);
router.get('/etudiant/en-attente', requireAuth, requireRole(['admin', 'superAdmin','Comptable']), etudiantController.getEtudiantsEnAttente);

router.get('/etudiant/non-inscrits',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    etudiantController.getEtudiantsNonInscrits
);

router.get('/etudiant/reinscriptibles',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    etudiantController.getEtudiantsReinscriptibles
);

router.post('/etudiant/ajout',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    uploadEtudiant.single('photo'),
    etudiantController.ajoutEtudiant
);

router.put('/etudiant/activer/:id',    requireAuth, requireRole(['admin', 'superAdmin']), etudiantController.activerEtudiant);
router.put('/etudiant/desactiver/:id', requireAuth, requireRole(['admin', 'superAdmin']), etudiantController.desactiverEtudiant);

// ==================================================
// ============ ✅ ROUTES INSCRIPTIONS ==============
// ==================================================
router.post('/etudiant/inscription',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    inscriptionController.inscrireEtudiant
);

router.get('/etudiant/inscriptions',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    inscriptionController.getAllInscriptions
);

router.get('/etudiant/inscriptions/stats',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    inscriptionController.getStatsInscriptions
);

router.get('/etudiant/:etudiantId/inscriptions',
    requireAuth,
    inscriptionController.getInscriptionsEtudiant
);

router.get('/etudiant/inscription/:id',
    requireAuth,
    inscriptionController.getUneInscription
);

router.put('/etudiant/inscription/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    inscriptionController.modifierInscription
);

router.delete('/etudiant/inscription/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin']),
    inscriptionController.supprimerInscription
);

router.get('/etudiant/:id',    requireAuth, etudiantController.getUnEtudiant);
router.put('/etudiant/:id',
    requireAuth,
    uploadEtudiant.single('photo'),
    etudiantController.modifierEtudiant
);
router.delete('/etudiant/:id', requireAuth, etudiantController.supprimerEtudiant);

// ==================================================
// ============ ✅ ROUTES ENSEIGNANTS ===============
// ==================================================
router.get('/enseignant/tous',
    requireAuth,
    requireRole(['admin', 'superAdmin']),
    enseignantController.getTousEnseignants
);

router.post('/enseignant/ajout',
    requireAuth,
    requireRole(['admin', 'superAdmin']),
    uploadCvEnseignant.single('cv'),
    enseignantController.ajouterEnseignant
);

router.get('/enseignant/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin']),
    enseignantController.getEnseignantById
);

router.put('/enseignant/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin']),
    uploadCvEnseignant.single('cv'),
    enseignantController.modifierEnseignant
);

router.delete('/enseignant/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin']),
    enseignantController.supprimerEnseignant
);

// ==================================================
// ============ ✅ ROUTES NOTES =====================
// ==================================================
router.get('/notes/stats',
    requireAuth,
    requireRole(['admin', 'superAdmin', 'enseignant']),
    noteController.getStatsNotes
);

router.get('/notes/classement/:classe',
    requireAuth,
    requireRole(['admin', 'superAdmin', 'enseignant']),
    noteController.getClassementClasse
);

router.get('/notes/etudiant/:etudiantId/moyennes',
    requireAuth,
    noteController.getMoyennesEtudiant
);

router.get('/notes/etudiant/:etudiantId/bulletin',
    requireAuth,
    noteController.getBulletinEtudiant
);

router.get('/notes/toutes',
    requireAuth,
    requireRole(['admin', 'superAdmin', 'enseignant']),
    noteController.getToutesLesNotes
);

router.post('/notes/ajout',
    requireAuth,
    requireRole(['admin', 'superAdmin', 'enseignant']),
    noteController.ajouterNote
);

router.get('/notes/:id',
    requireAuth,
    noteController.getNoteById
);

router.put('/notes/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin', 'enseignant']),
    noteController.modifierNote
);

router.delete('/notes/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin', 'enseignant']),
    noteController.supprimerNote
);

// ==================================================
// ============ ✅ ROUTES COMPTABILITÉ =============
// ⚠️ ORDRE CRITIQUE : routes fixes AVANT /:id
// ==================================================

// --- BARÈME DE FRAIS ---
router.get('/comptabilite/baremes',
    requireAuth,
    paiementController.getTousBaremes
);

router.post('/comptabilite/baremes',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    paiementController.creerOuModifierBareme
);

router.delete('/comptabilite/baremes/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    paiementController.supprimerBareme
);

// --- STATS & LISTES ---
router.get('/comptabilite/stats',
    requireAuth,
    paiementController.getStatsComptabilite
);

router.get('/comptabilite/eleves',
    requireAuth,
    paiementController.getElevesAvecStatut
);

router.get('/comptabilite/eleves/:etudiantId/fiche',
    requireAuth,
    paiementController.getFicheEleve
);

// --- PAIEMENTS ---
router.get('/comptabilite/paiements',
    requireAuth,
    paiementController.getTousPaiements
);

router.post('/comptabilite/paiements',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    paiementController.ajouterPaiement
);

router.get('/comptabilite/paiements/:id',
    requireAuth,
    paiementController.getPaiementById
);

router.put('/comptabilite/paiements/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    paiementController.modifierPaiement
);

router.delete('/comptabilite/paiements/:id',
    requireAuth,
    requireRole(['admin', 'superAdmin','Comptable']),
    paiementController.supprimerPaiement
);

// ==================================================
// ============ ✅ ROUTES FICHIERS ==================  🆕 AJOUT
// ⚠️ ORDRE CRITIQUE : routes fixes AVANT /:id
// ==================================================

// 🔔 Badge : demandes d'accès en attente (À PLACER AVANT /:id)
router.get('/fichiers/demandes-en-attente',
    requireAuth,
    fichierController.compterDemandesEnAttente
);

// 📋 Liste des fichiers accessibles
router.get('/fichiers',
    requireAuth,
    fichierController.listerFichiers
);

// 📤 Upload d'un fichier
router.post('/fichiers/upload',
    requireAuth,
    uploadFichier.single('fichier'),
    fichierController.uploadFichier
);

// ⬇️ Télécharger / ouvrir un fichier
router.get('/fichiers/:id/telecharger',
    requireAuth,
    fichierController.telechargerFichier
);

// 🙋 Demander l'accès à un fichier
router.post('/fichiers/:id/demander',
    requireAuth,
    fichierController.demanderAcces
);

// ✅ Traiter une demande (propriétaire)
router.put('/fichiers/:id/demande/:demandeId',
    requireAuth,
    fichierController.traiterDemande
);

// 🗑️ Supprimer un fichier
router.delete('/fichiers/:id',
    requireAuth,
    fichierController.supprimerFichier
);
// 🆕 FIN AJOUT ROUTES FICHIERS

module.exports = router;