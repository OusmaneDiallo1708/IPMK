// models/approvisionnementModel.js
const mongoose = require("mongoose");

const approvisionnementSchema = new mongoose.Schema({
  // Produit concerné
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'produit',
    required: true
  },
  
  // Nom du produit (dé-normalisé pour éviter les requêtes)
  produitNom: {
    type: String,
    required: true
  },
  
  // Prix d'achat (ce que l'utilisateur paie à l'admin)
  prixAchat: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Prix de vente conseillé
  prixVente: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Quantité approvisionnée
  quantite: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Stock restant pour cet utilisateur
  stockRestant: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Stock minimum pour alerte
  stockMin: {
    type: Number,
    default: 5
  },
  
  // Utilisateur qui reçoit l'approvisionnement
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  
  // Nom de l'utilisateur (dé-normalisé)
  utilisateurNom: {
    type: String,
    required: true
  },
  
  // Admin qui a fait l'approvisionnement
  approvisionnePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  
  // Nom de l'admin
  approvisionneParNom: {
    type: String,
    required: true
  },
  
  // Date d'approvisionnement
  dateApprovisionnement: {
    type: Date,
    default: Date.now
  },
  
  // Date d'expiration (optionnelle)
  dateExpiration: {
    type: Date,
    default: null
  },
  
  // Statut de l'approvisionnement
  statut: {
    type: String,
    enum: ['actif', 'epuise', 'expire'],
    default: 'actif'
  }
}, {
  timestamps: true
});

// Mettre à jour le statut automatiquement avant sauvegarde
approvisionnementSchema.pre('save', function(next) {
  if (this.stockRestant <= 0) {
    this.statut = 'epuise';
  } else if (this.dateExpiration && new Date(this.dateExpiration) < new Date()) {
    this.statut = 'expire';
  } else {
    this.statut = 'actif';
  }
  next();
});

const approvisionnementModel = mongoose.model('Approvisionnement', approvisionnementSchema);
module.exports = approvisionnementModel;