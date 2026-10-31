// backend/models/venteUtilisateurModel.js
const mongoose = require("mongoose");

const venteUtilisateurSchema = new mongoose.Schema({
  approvisionnement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Approvisionnement',
    required: true
  },
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'produit',
    required: true
  },
  produitNom: {
    type: String,
    required: true
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  utilisateurNom: {
    type: String,
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: 1
  },
  prixVente: {
    type: Number,
    required: true,
    min: 0
  },
  montantTotal: {
    type: Number,
    required: true
  },
  dateVente: {
    type: Date,
    default: Date.now
  },
  clientNom: {
    type: String,
    trim: true,
    default: null
  },
  // ✅ Statut de la vente
  statut: {
    type: String,
    enum: ['active', 'annulee', 'remboursee', 'depot_attente', 'depot_valide'],
    default: 'active'
  },
  // Ajouter après `clientNom` ou avant `statut` :
  modePaiement: {
    type: String,
    enum: ['comptant', 'partiel', 'credit'],
    default: 'comptant'
  },
  montantPaye: {
    type: Number,
    default: 0,
    min: 0
  },
  resteAPayer: {
    type: Number,
    default: 0,
    min: 0
  },
  // ✅ Demande de dépôt en caisse
  demandeDepot: {
    demandee: { type: Boolean, default: false },
    dateDemande: { type: Date, default: null },
    valideePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', default: null },
    valideeParNom: { type: String, default: null },
    dateValidation: { type: Date, default: null }
  },
  // ✅ Date de dépôt en caisse
  dateDepotCaisse: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

venteUtilisateurSchema.pre('save', function(next) {
  if (this.quantite && this.prixVente) {
    this.montantTotal = this.quantite * this.prixVente;
  }
  next();
});

const venteUtilisateurModel = mongoose.model('VenteUtilisateur', venteUtilisateurSchema);
module.exports = venteUtilisateurModel;