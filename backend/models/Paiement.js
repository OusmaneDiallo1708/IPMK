// ==================== models/Paiement.js ====================
const mongoose = require("mongoose");

const paiementSchema = new mongoose.Schema(
  {
    // 🔗 Référence étudiant
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "etudiant",
      required: [true, "L'étudiant est obligatoire"],
    },

    // 💰 Détails du paiement
    typePaiement: {
      type: String,
      enum: ["Inscription", "Scolarité", "Tenue", "Autre"],
      required: [true, "Le type de paiement est obligatoire"],
    },
    montant: {
      type: Number,
      required: [true, "Le montant est obligatoire"],
      min: [0, "Le montant ne peut pas être négatif"],
    },
    modePaiement: {
      type: String,
      enum: ["Espèces","Autre paiement"],
      default: "Espèces",
    },

    // 🏷️ Période scolaire
    classe: { type: String, required: true, trim: true },
    niveau: { type: String, default: "", trim: true },
    option: { type: String, default: "", trim: true },
    anneeScolaire: { type: String, required: true, trim: true },
    trimestre: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },

    // 📅 Date & Reçu
    datePaiement: {
      type: Date,
      default: Date.now,
    },
    numeroRecu: {
      type: String,
      unique: true,
      sparse: true,
    },

    // 💬 Commentaire
    commentaire: {
      type: String,
      default: "",
      trim: true,
    },

    // 👤 Qui a enregistré
    enregistrePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "utilisateur",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔍 Index pour recherche rapide
paiementSchema.index({ etudiant: 1, anneeScolaire: 1 });
paiementSchema.index({ anneeScolaire: 1, classe: 1 });
paiementSchema.index({ numeroRecu: 1 });

module.exports = mongoose.model("paiement", paiementSchema);