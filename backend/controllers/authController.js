const jwt = require('jsonwebtoken');
const utilisateurModel = require('../models/utilisateurModel');

const maxAge = 90 * 24 * 60 * 60;

const createToken = (id) => {
    return jwt.sign({ id }, process.env.TOKEN_SECRET, { expiresIn: maxAge });
};

module.exports.Connexion = async (req, res) => {
    console.log("📥 BODY reçu:", req.body);
    
    const { email, motDePasse } = req.body;

    try {
        if (!email || !motDePasse) {
            return res.status(400).json({ 
                success: false,
                message: 'Tous les champs sont requis' 
            });
        }

        // Appel à la méthode login
        const utilisateur = await utilisateurModel.login(email, motDePasse);
        
        if (!utilisateur) {
            return res.status(401).json({ 
                success: false,
                message: 'Email ou mot de passe incorrect' 
            });
        }

        // Vérifier si le compte est actif
        if (!utilisateur.actif) {
            return res.status(403).json({ 
                success: false,
                message: 'Votre compte est en attente d\'activation' 
            });
        }

        const token = createToken(utilisateur._id);

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: maxAge * 1000,
        });

        res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            token: token,
            utilisateur: {
                _id: utilisateur._id,
                nomComplet: utilisateur.nomComplet,
                email: utilisateur.email,
                role: utilisateur.role,
                actif: utilisateur.actif,
                photo: utilisateur.photo || null
            }
        });

    } catch (error) {
        console.error("❌ Erreur:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

module.exports.GetInfo = (req, res) => {
    const user = req.user || res.locals.user;
    
    if (user) {
        res.json({
            _id: user._id,
            nomComplet: user.nomComplet,
            email: user.email,
            photo: user.photo || null,
            role: user.role,
            actif: user.actif
        });
    } else {
        res.status(401).json({ message: "Utilisateur non connecté" });
    }
};

module.exports.Logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.status(200).json({ message: 'Déconnexion réussie' });
};