// middlewares/requireAuth.js
const jwt = require('jsonwebtoken');
const utilisateurModel = require('../models/utilisateurModel');

// ==================== CHECK USER (sans bloquer) ====================
module.exports.checkUser = (req, res, next) => {
    let token = req.cookies.jwt;
    
    // Vérifier le header Authorization
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('✅ Token trouvé dans header Authorization pour checkUser');
        }
    }
    
    if (token) {
        jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodeToken) => {
            if (err) {
                res.locals.user = null;
                return next();
            }
            try {
                const user = await utilisateurModel.findById(decodeToken.id).select('-motDePasse');
                res.locals.user = user;
                next();
            } catch (error) {
                res.locals.user = null;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};

// ==================== REQUIRE AUTH (authentification obligatoire) ====================
module.exports.requireAuth = async (req, res, next) => {
    try {
        let token = null;

        // 1️⃣ Vérifier d'abord dans les cookies
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
            console.log("✅ Token trouvé dans les cookies");
        }
        
        // 2️⃣ Sinon vérifier dans le header Authorization
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                console.log("✅ Token trouvé dans le header Authorization");
            }
        }
        
        // 3️⃣ Si aucun token trouvé
        if (!token) {
            console.log("❌ Aucun token trouvé");
            return res.status(401).json({ 
                success: false,
                message: "Accès non autorisé - Token manquant",
                code: "NO_TOKEN"
            });
        }

        // 4️⃣ Vérifier et décoder le token
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        console.log("🔓 Token décodé, ID utilisateur:", decodedToken.id);

        // 5️⃣ Récupérer l'utilisateur dans la base de données
        const utilisateur = await utilisateurModel.findById(decodedToken.id).select('-motDePasse');
        
        if (!utilisateur) {
            console.log("❌ Utilisateur non trouvé en base");
            return res.status(401).json({ 
                success: false,
                message: "Utilisateur non trouvé",
                code: "USER_NOT_FOUND"
            });
        }

        // 🔐 VÉRIFIER SI LE COMPTE EST ACTIF
        if (!utilisateur.actif) {
            console.log("❌ Compte inactif:", utilisateur.email);
            return res.status(403).json({ 
                success: false,
                message: "Votre compte est en attente d'activation par l'administrateur",
                code: "ACCOUNT_INACTIVE"
            });
        }

        // 6️⃣ Stocker l'utilisateur dans req et res.locals
        req.user = utilisateur;
        res.locals.user = utilisateur;
        
        console.log("✅ Authentification réussie pour:", utilisateur.email, "| Rôle:", utilisateur.role);
        next();
        
    } catch (err) {
        console.log("❌ Erreur d'authentification:", err.message);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: "Token invalide",
                code: "INVALID_TOKEN"
            });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: "Token expiré, veuillez vous reconnecter",
                code: "TOKEN_EXPIRED"
            });
        }
        
        return res.status(401).json({ 
            success: false,
            message: "Token invalide ou expiré",
            code: "AUTH_ERROR"
        });
    }
};

// ==================== REQUIRE ROLE (vérification des rôles) ====================
module.exports.requireRole = (rolesAuthorises = []) => {
    return (req, res, next) => {
        // Vérifier que l'utilisateur est connecté
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "Non authentifié - Veuillez vous connecter",
                code: "UNAUTHORIZED"
            });
        }
        
        // Vérifier si le rôle est autorisé
        if (rolesAuthorises.length > 0 && !rolesAuthorises.includes(req.user.role)) {
            console.log(`❌ Accès refusé pour ${req.user.email} - Rôle: ${req.user.role} - Requis: ${rolesAuthorises.join(' ou ')}`);
            return res.status(403).json({ 
                success: false,
                message: `Accès refusé. Cette action nécessite le rôle: ${rolesAuthorises.join(' ou ')}`,
                code: "FORBIDDEN",
                votreRole: req.user.role,
                rolesRequis: rolesAuthorises
            });
        }
        
        console.log(`✅ Accès autorisé pour ${req.user.email} - Rôle: ${req.user.role}`);
        next();
    };
};

// ==================== REQUIRE PERMISSION (pour employés) ====================
module.exports.requirePermission = (permissions = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "Non authentifié",
                code: "UNAUTHORIZED"
            });
        }
        
        // SuperAdmin et Admin ont toutes les permissions
        if (req.user.role === 'superAdmin' || req.user.role === 'admin') {
            return next();
        }
        
        // Employé - vérifier les permissions
        if (req.user.role === 'employé') {
            const permissionsAutorisees = ['products', 'sales'];
            const aAcces = permissions.every(perm => permissionsAutorisees.includes(perm));
            
            if (!aAcces) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé. Les employés ne peuvent accéder qu'aux produits et ventes.",
                    code: "INSUFFICIENT_PERMISSIONS"
                });
            }
            return next();
        }
        
        // Visiteur - accès limité
        if (req.user.role === 'visiteur') {
            return res.status(403).json({
                success: false,
                message: "Accès refusé. Veuillez contacter l'administrateur.",
                code: "VISITOR_RESTRICTED"
            });
        }
        
        next();
    };
};

// ==================== CAN MODIFY USER (vérification utilitaire) ====================
module.exports.canModifyUser = (req, targetUser) => {
    // SuperAdmin peut tout faire
    if (req.user.role === 'superAdmin') {
        return { authorized: true, message: '' };
    }
    
    // Admin peut modifier tout le monde sauf les SuperAdmin
    if (req.user.role === 'admin') {
        if (targetUser.role === 'superAdmin') {
            return { authorized: false, message: 'Un administrateur ne peut pas modifier un Super Admin' };
        }
        return { authorized: true, message: '' };
    }
    
    // Un utilisateur ne peut modifier que son propre compte
    if (req.user._id.toString() === targetUser._id.toString()) {
        return { authorized: true, message: '' };
    }
    
    return { authorized: false, message: 'Vous ne pouvez modifier que votre propre compte' };
};