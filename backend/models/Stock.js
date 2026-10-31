const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    lieu: {
        type: String,
        required: true,
        trim: true
    },
    detail: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['entree', 'sortie'],
        required: true
    },
    montant: {  // Montant en GNF pour ce mouvement
        type: Number,
        required: true,
        min: 0
    },
    quantite: {  // Quantité d'articles (optionnel)
        type: Number,
        default: 1,
        min: 1
    },
    prixUnitaire: {  // Prix unitaire en GNF
        type: Number,
        default: 0,
        min: 0
    },
    montantTotal: {  // Montant total cumulé en GNF
        type: Number,
        default: 0
    },
    quantiteTotal: {  // Quantité totale cumulée
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Stock', stockSchema);