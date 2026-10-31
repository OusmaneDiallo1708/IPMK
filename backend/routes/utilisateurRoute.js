// routes/utilisateurRoute.js
const mongoose = require('mongoose');
const router = require('express').Router();
const multer = require("multer");
const utilisateurController = require('../controllers/utilisateurController');
const uploadUser = require('../middlewares/uploadUser');
const authController = require('../controllers/authController');
const { requireAuth, requireRole, requirePermission } = require('../middlewares/requireAuth');
// ==================== ROUTES PUBLIQUES ====================
router.post('/ajoutUtilisateur', uploadUser.single("photo"), utilisateurController.ajoutUtilisateur);
router.post('/connexion', authController.Connexion);
router.get('/logout', requireAuth, authController.Logout);

// ==================== ROUTES PROTÉGÉES ====================
router.get('/profil', requireAuth, authController.GetInfo);
router.get('/getUnUtilisateur/:id', requireAuth, utilisateurController.afficherUnUtilisateur);
router.put('/modifierUnUtilisateur/:id', requireAuth, uploadUser.single("photo"), utilisateurController.modifierUnUtilisateur);
router.delete('/supprimerUnUtilisateur/:id', requireAuth, utilisateurController.supprimerUnUtilisateur);

// ==================== ROUTES ADMIN & SUPER ADMIN ====================
router.get('/getAllUtilisateurs', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.afficherTousLesUtilisateurs);
router.put('/activerUtilisateur/:id', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.activerUtilisateur);
router.put('/desactiverUtilisateur/:id', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.desactiverUtilisateur);
router.put('/modifierRole/:id', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.modifierRoleUtilisateur);
router.get('/utilisateursEnAttente', requireAuth, requireRole(['admin', 'superAdmin']), utilisateurController.getUtilisateursEnAttente);
// ==================== ROUTE DE TEST ====================
router.get('/verify', requireAuth, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authentification valide",
        user: {
            _id: req.user._id,
            nomComplet: req.user.nomComplet,
            email: req.user.email,
            role: req.user.role,
            actif: req.user.actif
        }
    });
});

module.exports = router;