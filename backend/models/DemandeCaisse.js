const mongoose = require('mongoose');

const demandeCaisseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['entree', 'sortie'],
    required: true
  },
  montant: {
    type: Number,
    required: true,
    min: 0
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
  quantite: {
    type: Number,
    default: 1,
    min: 1
  },
  prixUnitaire: {
    type: Number,
    default: 0,
    min: 0
  },
  demandeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuvee', 'refusee'],
    default: 'en_attente'
  },
  traitePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  dateTraitement: Date,
  commentaire: String,
  mouvementStockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  }
}, { timestamps: true });

module.exports = mongoose.model('DemandeCaisse', demandeCaisseSchema);