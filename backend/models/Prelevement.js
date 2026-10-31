const mongoose = require('mongoose');

const prelevementSchema = new mongoose.Schema({
  montant: {
    type: Number,
    required: true,
    min: 0
  },
  datePrelevement: {
    type: Date,
    default: Date.now
  },
  commentaire: {
    type: String,
    default: 'Alimentation de la caisse depuis les ventes'
  },
  effectuePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }
}, { timestamps: true });

module.exports = mongoose.model('Prelevement', prelevementSchema);