// ==================== models/Note.js ====================
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // ==================== RÉFÉRENCE ÉTUDIANT ====================
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "etudiant",
      required: [true, "L'étudiant est obligatoire"],
    },

    // ==================== INFORMATIONS SCOLAIRES ====================
    matiere: {
      type: String,
      required: [true, "La matière est obligatoire"],
      trim: true,
    },
    classe: {
      type: String,
      required: [true, "La classe est obligatoire"],
      trim: true,
    },
    niveau: {
      type: String,
      default: "",
      trim: true,
    },
    option: {
      type: String,
      default: "",
      trim: true,
    },
    anneeScolaire: {
      type: String,
      required: [true, "L'année scolaire est obligatoire"],
      trim: true,
    },

    // ==================== LA NOTE ====================
    note: {
      type: Number,
      required: [true, "La note est obligatoire"],
      min: [0, "La note ne peut pas être inférieure à 0"],
      max: [20, "La note ne peut pas dépasser 20"],
    },
    coefficient: {
      type: Number,
      default: 1,
      min: [0.5, "Le coefficient minimum est 0.5"],
      max: [10, "Le coefficient maximum est 10"],
    },

    // ==================== TYPE D'ÉVALUATION ====================
    type: {
      type: String,
      enum: ["Devoir", "Composition", "Interrogation", "Examen"],
      default: "Devoir",
    },

    // ==================== PÉRIODE ====================
    trimestre: {
      type: Number,
      enum: [1, 2, 3],
      required: [true, "Le trimestre est obligatoire"],
    },
    dateEvaluation: {
      type: Date,
      default: Date.now,
    },

    // ==================== ENSEIGNANT (optionnel) ====================
    enseignant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enseignant",
      default: null,
    },

    // ==================== COMMENTAIRE ====================
    commentaire: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// ==================== INDEX ====================
noteSchema.index({ etudiant: 1, matiere: 1, trimestre: 1, anneeScolaire: 1 });
noteSchema.index({ classe: 1, anneeScolaire: 1 });
noteSchema.index({ type: 1 });
noteSchema.index({ dateEvaluation: -1 });

// ==================== EXPORT ====================
module.exports = mongoose.model("Note", noteSchema);