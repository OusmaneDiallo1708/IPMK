// backend/middlewares/authmiddlewear.js
const jwt = require('jsonwebtoken');
const utilisateurModel = require('../models/utilisateurModel');

// Middleware pour vérifier l'utilisateur (sans bloquer)
module.exports.checkUser = (req, res, next) => {
    console.log('🔍 Checking user for:', req.method, req.url);
    
    let token = null;
    
    // Vérifier le cookie
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    
    // Vérifier le header Authorization
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    
    if (token) {
        // ⚠️ CORRECTION : utiliser JWT_SECRET (et non TOKEN_SECRET)
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodeToken) => {
            if (err) {
                console.log("❌ Token verification failed:", err.message);
                res.locals.user = null;
                return next();
            }
            
            try {
                const user = await utilisateurModel.findById(decodeToken.id);
                res.locals.user = user;
                console.log('✅ User authenticated:', user ? user.email : 'none');
            } catch (error) {
                console.log("❌ Database error:", error.message);
                res.locals.user = null;
            }
            next();
        });
    } else {
        console.log("⚠️ No JWT token found");
        res.locals.user = null;
        next();
    }
};

// Middleware pour exiger l'authentification
module.exports.requireAuth = (req, res, next) => {
    console.log('🔐 Require auth for:', req.method, req.url);
    
    let token = null;
    
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    
    if (!token) {
        console.log('❌ No token found');
        return res.status(401).json({ 
            message: "Accès non autorisé - Token manquant",
            code: "NO_TOKEN"
        });
    }
    
    // ⚠️ CORRECTION : utiliser JWT_SECRET
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodeToken) => {
        if (err) {
            console.log('❌ Invalid token:', err.message);
            return res.status(401).json({ 
                message: "Token invalide ou expiré",
                code: "INVALID_TOKEN"
            });
        }
        
        try {
            const user = await utilisateurModel.findById(decodeToken.id);
            if (!user) {
                console.log('❌ User not found');
                return res.status(401).json({ 
                    message: "Utilisateur non trouvé",
                    code: "USER_NOT_FOUND"
                });
            }
            
            console.log('✅ Authenticated:', user.email);
            req.user = user;
            res.locals.user = user;
            next();
        } catch (error) {
            console.log('❌ Database error:', error.message);
            return res.status(500).json({ 
                message: "Erreur serveur",
                code: "SERVER_ERROR"
            });
        }
    });
};