const mongoose = require('mongoose');

// ------------------------------------------------------------------
// Sous-document : demande d'accès à un fichier
// ------------------------------------------------------------------
const demandeAccesSchema = new mongoose.Schema({
  demandeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  message: { type: String, default: '', trim: true, maxlength: 500 },
  statut: {
    type: String,
    enum: ['en_attente', 'approuvee', 'refusee'],
    default: 'en_attente'
  },
  dateDemande:    { type: Date, default: Date.now },
  dateTraitement: { type: Date }
}, { _id: true });

// ------------------------------------------------------------------
// Schéma principal : fichier uploadé
// ------------------------------------------------------------------
const fichierSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  nomOriginal: {
    type: String,
    required: true,
    trim: true
  },
  chemin: {
    type: String,
    required: true
  },
  typeMime: {
    type: String,
    required: true
  },
  extension: {
    type: String,
    required: true,
    lowercase: true
  },
  taille: {
    type: Number,
    required: true,
    min: 0
  },
  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true,
    index: true
  },
  autorisations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  demandesAcces: [demandeAccesSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour accélérer les recherches
fichierSchema.index({ proprietaire: 1, createdAt: -1 });
fichierSchema.index({ autorisations: 1 });

module.exports = mongoose.model('Fichier', fichierSchema);