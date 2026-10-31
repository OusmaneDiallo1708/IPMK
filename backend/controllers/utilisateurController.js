const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const utilisateurModel = require('../models/utilisateurModel');
const ObjectID = require('mongoose').Types.ObjectId;

// ==================== LOGIN ====================
module.exports.login = async (req, res) => {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
        return res.status(400).json({ 
            success: false,
            message: "Email et mot de passe requis" 
        });
    }

    try {
        const utilisateur = await utilisateurModel.login(email, motDePasse);
        if (!utilisateur) {
            return res.status(401).json({ 
                success: false,
                message: "Identifiants invalides" 
            });
        }

        // Vérifier si le compte est actif
        if (!utilisateur.actif) {
            return res.status(403).json({
                success: false,
                message: "Votre compte est en attente d'activation par l'administrateur",
                code: "ACCOUNT_INACTIVE"
            });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { id: utilisateur._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retourner l'utilisateur sans le mot de passe
        const userData = utilisateur.toObject();
        delete userData.motDePasse;

        res.status(200).json({
            success: true,
            message: "Connexion réussie",
            token: token,
            utilisateur: userData
        });
    } catch (error) {
        console.error("❌ Erreur login:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Erreur serveur" 
        });
    }
};

// ==================== AJOUT UTILISATEUR ====================
module.exports.ajoutUtilisateur = async (req, res) => {
    const { nomComplet, email, motDePasse, genre, telephone, role } = req.body;
  
    let photoPath = null;
    if (req.file) {
        photoPath = `/uploads/user/${req.file.filename}`;
    }
  
    try {
        if (!nomComplet || !email || !motDePasse) {
            return res.status(400).json({ 
                success: false,
                message: "Tous les champs (nom, email, mot de passe) sont obligatoires." 
            });
        }
  
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: "Email invalide." 
            });
        }
  
        const exist = await utilisateurModel.findOne({ email });
        if (exist) {
            return res.status(400).json({ 
                success: false,
                message: "Cet email est déjà utilisé." 
            });
        }
  
        const utilisateur = await utilisateurModel.create({
            nomComplet,
            email,
            motDePasse,
            genre,
            telephone,
            role: role || 'visiteur',
            photo: photoPath,
            actif: false,
            dateInscription: new Date()
        });
  
        res.status(201).json({
            success: true,
            message: `${utilisateur.nomComplet} a été ajouté avec succès. En attente d'activation par l'administrateur.`,
            utilisateur: {
                _id: utilisateur._id,
                nomComplet: utilisateur.nomComplet,
                email: utilisateur.email,
                role: utilisateur.role,
                actif: utilisateur.actif
            }
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error.message);
        res.status(500).json({ 
            success: false,
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// ==================== ACTIVER UN UTILISATEUR ====================
module.exports.activerUtilisateur = async (req, res) => {
    const { id } = req.params;
    
    console.log("🔍 activerUtilisateur - ID reçu:", id);
    
    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'Identifiant invalide' 
        });
    }
    
    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Accès non autorisé. Seul un administrateur peut activer des comptes.' 
        });
    }
    
    try {
        const utilisateur = await utilisateurModel.findById(id);
        
        if (!utilisateur) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }
        
        if (utilisateur.actif) {
            return res.status(400).json({ 
                success: false,
                message: 'Cet utilisateur est déjà actif' 
            });
        }
        
        utilisateur.actif = true;
        utilisateur.dateActivation = new Date();
        utilisateur.activePar = req.user._id;
        
        await utilisateur.save();
        
        res.status(200).json({
            success: true,
            message: `✅ Le compte de ${utilisateur.nomComplet} a été activé avec succès`,
            utilisateur: {
                _id: utilisateur._id,
                nomComplet: utilisateur.nomComplet,
                email: utilisateur.email,
                actif: utilisateur.actif,
                role: utilisateur.role
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'activation:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// ==================== DÉSACTIVER UN UTILISATEUR ====================
module.exports.desactiverUtilisateur = async (req, res) => {
    const { id } = req.params;
    
    console.log("🔍 desactiverUtilisateur - ID reçu:", id);
    
    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'Identifiant invalide' 
        });
    }
    
    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Accès non autorisé. Seul un administrateur peut désactiver des comptes.' 
        });
    }
    
    try {
        const utilisateur = await utilisateurModel.findById(id);
        
        if (!utilisateur) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }
        
        if (utilisateur._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false,
                message: '❌ Vous ne pouvez pas désactiver votre propre compte' 
            });
        }
        
        if (utilisateur.role === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({ 
                success: false,
                message: 'Seul un Super Admin peut désactiver un autre Super Admin' 
            });
        }
        
        utilisateur.actif = false;
        await utilisateur.save();
        
        res.status(200).json({
            success: true,
            message: `⚠️ Le compte de ${utilisateur.nomComplet} a été désactivé`,
            utilisateur: {
                _id: utilisateur._id,
                nomComplet: utilisateur.nomComplet,
                email: utilisateur.email,
                actif: utilisateur.actif,
                role: utilisateur.role
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de la désactivation:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// ==================== MODIFIER LE RÔLE D'UN UTILISATEUR ====================
module.exports.modifierRoleUtilisateur = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    console.log("🔍 modifierRoleUtilisateur - ID reçu:", id);
    console.log("🔍 modifierRoleUtilisateur - Nouveau rôle:", role);
    
    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'Identifiant invalide' 
        });
    }
    
    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Accès non autorisé. Seul un administrateur peut modifier les rôles.' 
        });
    }
    
    const rolesValides = ['superAdmin', 'admin', 'Etudiant', 'Enseignant', 'Tuteur', 'Comptable', 'visiteur'];
    if (!rolesValides.includes(role)) {
        return res.status(400).json({ 
            success: false,
            message: 'Rôle invalide. Les rôles autorisés sont: superAdmin, admin, Etudiant, Enseignant, Tuteur, Comptable, visiteur' 
        });
    }
    
    try {
        const utilisateur = await utilisateurModel.findById(id);
        
        if (!utilisateur) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }
        
        if (utilisateur.role === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({ 
                success: false,
                message: 'Seul un Super Admin peut modifier le rôle d\'un Super Admin' 
            });
        }
        
        if (req.user.role === 'admin' && role === 'superAdmin') {
            return res.status(403).json({ 
                success: false,
                message: 'Un administrateur ne peut pas promouvoir quelqu\'un au rang de Super Admin' 
            });
        }
        
        const ancienRole = utilisateur.role;
        utilisateur.role = role;
        await utilisateur.save();
        
        const roleNames = {
            'superAdmin': 'Super Admin',
            'admin': 'Administrateur',
            'Etudiant': 'Étudiant',
            'Enseignant': 'Enseignant',
            'Tuteur': 'Tuteur',
            'Comptable': 'Comptable',
            'visiteur': 'Visiteur'
        };
        
        res.status(200).json({
            success: true,
            message: `Rôle de ${utilisateur.nomComplet} modifié : ${roleNames[ancienRole] || ancienRole} → ${roleNames[role] || role}`,
            utilisateur: {
                _id: utilisateur._id,
                nomComplet: utilisateur.nomComplet,
                email: utilisateur.email,
                role: utilisateur.role
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de la modification du rôle:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// ==================== LISTE DES UTILISATEURS EN ATTENTE ====================
module.exports.getUtilisateursEnAttente = async (req, res) => {
    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            message: 'Accès non autorisé' 
        });
    }
    
    try {
        const utilisateurs = await utilisateurModel.find({ actif: false })
            .select('-motDePasse')
            .sort({ dateInscription: -1 });
        
        res.status(200).json({
            success: true,
            count: utilisateurs.length,
            message: `${utilisateurs.length} utilisateur(s) en attente d'activation`,
            utilisateurs
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// ==================== AFFICHER TOUS LES UTILISATEURS ====================
module.exports.afficherTousLesUtilisateurs = async (req, res) => {
    try {
        const utilisateurs = await utilisateurModel.find()
            .select('-motDePasse')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ 
            success: true,
            message: 'Liste de tous les utilisateurs', 
            count: utilisateurs.length,
            utilisateur: utilisateurs
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur Serveur' 
        });
    }
};

// ==================== AFFICHER UN UTILISATEUR ====================
module.exports.afficherUnUtilisateur = async (req, res) => {
    const utilisateurId = req.params.id;
    
    if (!ObjectID.isValid(utilisateurId)) {
        return res.status(400).json({ 
            success: false,
            message: 'Identifiant invalide' 
        });
    }
    
    try {
        const utilisateur = await utilisateurModel.findById(utilisateurId).select('-motDePasse');
        if (!utilisateur) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }
        res.status(200).json({ 
            success: true,
            message: 'Détails de l\'utilisateur', 
            utilisateur 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur Serveur' 
        });
    }
};

// ==================== MODIFIER UN UTILISATEUR ====================
module.exports.modifierUnUtilisateur = async (req, res) => {
    const utilisateurId = req.params.id;
    
    let photoPath = null;
    if (req.file) {
        photoPath = `/uploads/user/${req.file.filename}`;
    }
    
    if (!ObjectID.isValid(utilisateurId)) {
        return res.status(400).json({ 
            success: false,
            message: 'Identifiant invalide' 
        });
    }
    
    try {
        const utilisateurExistant = await utilisateurModel.findById(utilisateurId);
        if (!utilisateurExistant) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }
        
        const isAdmin = req.user && ['admin', 'superAdmin'].includes(req.user.role);
        const isSelf = req.user && req.user._id.toString() === utilisateurId;
        
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ 
                success: false,
                message: 'Vous ne pouvez modifier que votre propre profil' 
            });
        }
        
        if (!isAdmin && req.body.role) {
            delete req.body.role;
        }
        
        const updateData = {
            nomComplet: req.body.nomComplet,
            genre: req.body.genre,
            telephone: req.body.telephone,
        };
        
        if (isAdmin && req.body.role) {
            updateData.role = req.body.role;
        }
        
        if (photoPath) {
            updateData.photo = photoPath;
        }
        
        if (req.body.motDePasse && req.body.motDePasse.length > 0) {
            const salt = await bcrypt.genSalt(10);
            updateData.motDePasse = await bcrypt.hash(req.body.motDePasse, salt);
        }
        
        const utilisateur = await utilisateurModel.findByIdAndUpdate(
            utilisateurId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-motDePasse');
        
        res.status(200).json({
            success: true,
            message: `${utilisateur.nomComplet} a été modifié avec succès`,
            utilisateur
        });
    } catch (error) {
        console.error('Erreur lors de la modification :', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// ==================== SUPPRIMER UN UTILISATEUR ====================
module.exports.supprimerUnUtilisateur = async (req, res) => {
    const utilisateurId = req.params.id;
    
    if (!ObjectID.isValid(utilisateurId)) {
        return res.status(400).json({ 
            success: false,
            message: 'Identifiant invalide' 
        });
    }
    
    try {
        const utilisateur = await utilisateurModel.findById(utilisateurId);
        
        if (!utilisateur) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }
        
        const isAdmin = req.user && ['admin', 'superAdmin'].includes(req.user.role);
        const isSelf = req.user && req.user._id.toString() === utilisateurId;
        
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ 
                success: false,
                message: 'Vous ne pouvez supprimer que votre propre compte' 
            });
        }
        
        if (utilisateur.role === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({ 
                success: false,
                message: 'Seul un Super Admin peut supprimer un autre Super Admin' 
            });
        }
        
        await utilisateurModel.findByIdAndDelete(utilisateurId);
        
        res.status(200).json({ 
            success: true,
            message: `${utilisateur.nomComplet} a été supprimé avec succès` 
        });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};