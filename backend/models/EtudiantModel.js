const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const etudiantSchema = new mongoose.Schema(
    {
        // ==================== IDENTITÉ ====================
        // ✅ AJOUT : INA (identifiant unique obligatoire, avant matricule)
        ina: {
            type: String,
            required: [true, "L'INA est obligatoire"],
            unique: true,
            uppercase: true,
            trim: true
        },
        matricule: {
            type: String,
            unique: true,
            sparse: true,        // autorise plusieurs étudiants sans matricule
            uppercase: true,
            trim: true,
            default: null
        },
        nom: {
            type: String,
            required: [true, "Le nom est obligatoire"],
            trim: true
        },
        prenom: {
            type: String,
            required: [true, "Le prénom est obligatoire"],
            trim: true
        },
        genre: {
            type: String,
            enum: ['Homme', 'Femme'],
            default: 'Homme'
        },

        // ==================== COORDONNÉES ====================
        contacts: {
            telephone: { type: String, trim: true, default: null },
            email:     { type: String, trim: true, lowercase: true, default: null },
            whatsapp:  { type: String, trim: true, default: null },
            adresse:   { type: String, trim: true, default: null }
        },

        // ==================== CONTACT DU TITULAIRE ====================
        contacts_titre: {
            nom:       { type: String, trim: true, default: null },
            telephone: { type: String, trim: true, default: null },
            email:     { type: String, trim: true, lowercase: true, default: null },
            fonction:  { type: String, trim: true, default: null }
        },

        // ==================== AUTRES ====================
        titre: {
            type: String,
            default: 'etudiant'
        },
        motDePasse: {
            type: String,
            default: null        // 👈 optionnel
        },
        photo: {
            type: String,
            default: null
        },

        // ==================== STATUT COMPTE ====================
        actif: {
            type: Boolean,
            default: false
        },
        dateAjout: {
            type: Date,
            default: Date.now    // 👈 date d'ajout automatique
        },
        dateActivation: {
            type: Date,
            default: null
        },
        activePar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'utilisateur',
            default: null
        },

        // ==================================================
        // ========== 🎓 INSCRIPTION / RÉINSCRIPTION ========
        // ==================================================

        // A déjà été inscrit au moins une fois (statut global)
        inscrit: {
            type: Boolean,
            default: false
        },

        // Année scolaire de SA DERNIÈRE inscription (ex: "2026-2027")
        // Sert à savoir s'il est inscrit POUR L'ANNÉE EN COURS
        anneeInscriptionActuelle: {
            type: String,
            trim: true,
            default: null
        },

        // ============ DERNIERS DÉTAILS (pré-remplir la réinscription) ============
        derniereClasse: {
            type: String,
            trim: true,
            default: null
        },
        dernierNiveau: {
            type: String,
            trim: true,
            default: null
        },
        derniereOption: {
            type: String,
            trim: true,
            default: null
        },

        // Référence vers la dernière inscription (pour "Voir historique")
        derniereInscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'inscription',
            default: null
        },

        // Nombre total d'inscriptions (utile pour stats rapides)
        nombreInscriptions: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true         // ajoute createdAt + updatedAt
    }
);

// ==================== VIRTUEL nomComplet ====================
etudiantSchema.virtual('nomComplet').get(function () {
    return `${this.prenom} ${this.nom}`.trim();
});

etudiantSchema.set('toJSON', { virtuals: true });
etudiantSchema.set('toObject', { virtuals: true });

// ==================== HOOK : HASH DU MOT DE PASSE ====================
etudiantSchema.pre('save', async function (next) {
    // 👇 Skip si pas de mot de passe (optionnel)
    if (!this.motDePasse) return next();
    if (!this.isModified('motDePasse')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// ==================== MÉTHODE STATIQUE : LOGIN ====================
etudiantSchema.statics.login = async function (identifiant, motDePasse) {
    if (!identifiant || !motDePasse) return null;

    // Recherche par email OU matricule
    const etudiant = await this.findOne({
        $or: [
            { 'contacts.email': identifiant.toLowerCase() },
            { matricule: identifiant.toUpperCase() }
        ]
    });

    if (!etudiant || !etudiant.motDePasse) return null;

    const match = await bcrypt.compare(motDePasse, etudiant.motDePasse);
    if (!match) return null;

    return etudiant;
};

// ==================== MÉTHODE : EST INSCRIT POUR UNE ANNÉE ? ====================
etudiantSchema.methods.estInscritPour = function (anneeScolaire) {
    return this.anneeInscriptionActuelle === anneeScolaire && this.inscrit === true;
};

module.exports = mongoose.model('etudiant', etudiantSchema);