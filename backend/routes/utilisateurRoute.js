// routes/utilisateurRoute.js
const mongoose = require('mongoose');
const router = require('express').Router();
const multer = require("multer");
const utilisateurController = require('../controllers/utilisateurController');
const uploadUser = require('../middlewares/uploadUser');
const authController = require('../controllers/authController');
const { requireAuth, requireRole, requirePermission } = require('../middlewares/requireAuth');

// Import du contrôleur d'approvisionnement
const approvisionnementController = require('../controllers/approvisionnementController');

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

// ==================== ROUTES D'APPROVISIONNEMENT ====================
router.post('/approvisionner', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.approvisionnerUtilisateur);
router.get('/approvisionnements', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.getApprovisionnements);
router.get('/stock-utilisateur/:userId', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.getStockUtilisateur);
router.get('/stats-ventes', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.getStatsAdmin);

// ==================== ROUTES DEMANDES DE DÉPÔT ====================
router.get('/demandes-depot', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.getDemandesDepot);
router.post('/valider-depot/:venteId', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.validerDepotCaisse);
router.post('/demander-depot/:venteId', requireAuth, approvisionnementController.demanderDepotCaisse);
router.delete('/annuler-vente/:venteId', requireAuth, approvisionnementController.annulerVente);

// ==================== ROUTES UTILISATEUR ====================
router.get('/mon-stock', requireAuth, approvisionnementController.getMonStock);
router.post('/enregistrer-vente', requireAuth, approvisionnementController.enregistrerVente);
router.get('/mes-ventes', requireAuth, approvisionnementController.getMesVentes);
// ✅ AJOUTE CES 3 LIGNES
router.put('/approvisionnement/:id', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.updateApprovisionnement);
router.delete('/approvisionnement/:id', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.deleteApprovisionnement);
router.get('/approvisionnements-all', requireAuth, requireRole(['admin', 'superAdmin']), approvisionnementController.getAllApprovisionnements);

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