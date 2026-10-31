// ==================== models/BaremeFrais.js ====================
const mongoose = require("mongoose");

const baremeFraisSchema = new mongoose.Schema(
  {
    classe: {
      type: String,
      required: [true, "La classe est obligatoire"],
      trim: true,
    },
    anneeScolaire: {
      type: String,
      required: [true, "L'année scolaire est obligatoire"],
      trim: true,
    },
    fraisInscription: {
      type: Number,
      default: 0,
      min: 0,
    },
    fraisScolarite: {
      type: Number,
      default: 0,
      min: 0,
    },
    fraisTenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Un seul barème par classe + année
baremeFraisSchema.index({ classe: 1, anneeScolaire: 1 }, { unique: true });

module.exports = mongoose.model("baremeFrais", baremeFraisSchema);