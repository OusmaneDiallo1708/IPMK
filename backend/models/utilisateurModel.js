const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const utilisateurSchema = new mongoose.Schema({
    nomComplet: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30
    },
    photo: {
        type: String,
        default: null
    },
    genre: {
        type: String,
        enum: ['Homme', 'Femme'],
        default: 'Homme'
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Le mail est incorrect'],
        maxlength: 100
    },
    telephone: {
        type: String,
        unique: true,
        trim: true,
        maxlength: 30,
        default: null
    },
    role: {
        type: String,
        enum: ['superAdmin', 'admin', 'Etudiant', 'Enseignant', 'Tuteur', 'Comptable', 'visiteur'],
        default: 'visiteur'
    },
    motDePasse: {
        type: String,
        required: true,
        trim: true
    },
    actif: {
        type: Boolean,
        default: false
    },
    dateInscription: {
        type: Date,
        default: Date.now
    },
    dateActivation: {
        type: Date
    },
    activePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    }
});

// Hacher le mot de passe avant sauvegarde
utilisateurSchema.pre('save', async function(next) {
    if (!this.isModified('motDePasse')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ✅ MÉTHODE LOGIN STATIQUE
utilisateurSchema.statics.login = async function(email, motDePasse) {
    try {
        console.log("🔐 [MODEL] Recherche de:", email);
        
        const utilisateur = await this.findOne({ email });
        
        if (!utilisateur) {
            console.log("❌ [MODEL] Utilisateur non trouvé");
            return null;
        }
        
        console.log("✅ [MODEL] Utilisateur trouvé");
        
        const auth = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
        
        if (!auth) {
            console.log("❌ [MODEL] Mot de passe incorrect");
            return null;
        }
        
        console.log("✅ [MODEL] Mot de passe valide");
        
        return utilisateur;
        
    } catch (error) {
        console.error("❌ [MODEL] Erreur login:", error.message);
        return null;
    }
};

const utilisateurModel = mongoose.model('Utilisateur', utilisateurSchema);
module.exports = utilisateurModel;