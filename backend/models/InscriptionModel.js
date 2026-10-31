const mongoose = require('mongoose');

const inscriptionSchema = new mongoose.Schema(
    {
        // ==================== LIEN ÉTUDIANT ====================
        etudiant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'etudiant',
            required: [true, "L'étudiant est obligatoire"],
            index: true
        },

        // ==================== CHAMPS ====================
        classe:        { type: String, trim: true, default: null },   // Ex: L1
        niveau:        { type: String, trim: true, default: null },   // Ex: C.A.P/BEP
        option:        { type: String, trim: true, default: null },   // Ex: Comptabilite Gestion

        anneeScolaire: {
            type: String,
            trim: true,
            required: [true, "L'année scolaire est obligatoire"]      // ✅ OBLIGATOIRE
            // Ex: 2026-2027
        },

        fraisInscription: {
            type: Number,
            default: 0,
            min: [0, "Les frais ne peuvent pas être négatifs"]
        },

        dateInscription: {
            type: Date,
            default: Date.now
        },

        statut: {
            type: String,
            enum: ['en_cours', 'validee', 'annulee'],
            default: 'validee'
        },

        inscritPar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'utilisateur',
            default: null
        }
    },
    { timestamps: true }
);

// ==================== INDEX UNIQUE (anti-doublon) ====================
// Un étudiant ne peut avoir qu'UNE inscription VALIDÉE par année scolaire
// → permet la réinscription sur d'autres années
inscriptionSchema.index(
    { etudiant: 1, anneeScolaire: 1 },
    {
        unique: true,
        partialFilterExpression: { statut: 'validee' }
    }
);

// ==================== VIRTUEL (libellé lisible) ====================
inscriptionSchema.virtual('libelle').get(function () {
    return `${this.classe || ''} ${this.niveau || ''} ${this.option || ''} (${this.anneeScolaire})`.trim();
});

inscriptionSchema.set('toJSON', { virtuals: true });
inscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('inscription', inscriptionSchema);