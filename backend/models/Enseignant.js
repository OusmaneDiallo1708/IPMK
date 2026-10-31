// ==================== models/EnseignantModel.js ====================
const mongoose = require('mongoose');

const enseignantSchema = new mongoose.Schema(
  {
    // ==================== IDENTITÉ ====================
    matricule: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      default: null,
    },
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
      maxlength: 50,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
      maxlength: 50,
    },
    genre: {
      type: String,
      enum: ['Homme', 'Femme', ''],
      default: '',
    },
    adresse: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    // ==================== 🆕 MULTI-MATIÈRES ====================
    // Tableau de matières (un enseignant peut en avoir plusieurs)
    matieres: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 20; // max 20 matières
        },
        message: "Maximum 20 matières par enseignant",
      },
    },

    // ⚠️ Ancien champ (compatibilité) — synchronisé automatiquement
    matiere: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================== PROFESSIONNEL ====================
    heures: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================== CONTACTS ====================
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [/^$|^\S+@\S+\.\S+$/, "Email invalide"],
    },
    telephone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 30,
    },

    // Sous-objet contacts (compat avec ancien système)
    contacts: {
      telephone: { type: String, default: "" },
      email: { type: String, default: "" },
      adresse: { type: String, default: "" },
    },

    // ==================== FICHIERS ====================
    cv: {
      type: String,
      default: null,
    },
    photo: {
      type: String,
      default: null,
    },

    // ==================== MÉTA ====================
    dateAjout: {
      type: Date,
      default: Date.now,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== VIRTUALS ====================
// Nom complet
enseignantSchema.virtual('nomComplet').get(function () {
  return `${this.prenom || ''} ${this.nom || ''}`.trim();
});

// ==================== MIDDLEWARES ====================

// ✅ Sync automatique matiere <-> matieres (compatibilité)
enseignantSchema.pre('save', function (next) {
  // Si matieres vide mais matiere rempli → copie
  if ((!this.matieres || this.matieres.length === 0) && this.matiere) {
    this.matieres = [this.matiere];
  }

  // Si matieres rempli mais matiere vide → copie la première
  if (this.matieres && this.matieres.length > 0 && !this.matiere) {
    this.matiere = this.matieres[0];
  }

  // Nettoyage : trim + suppression des doublons + suppression des vides
  if (Array.isArray(this.matieres)) {
    this.matieres = [
      ...new Set(
        this.matieres
          .map((m) => String(m).trim())
          .filter((m) => m.length > 0)
      ),
    ];
  }

  // Sync contacts (compat)
  if (this.telephone && !this.contacts?.telephone) {
    this.contacts = this.contacts || {};
    this.contacts.telephone = this.telephone;
  }
  if (this.email && !this.contacts?.email) {
    this.contacts = this.contacts || {};
    this.contacts.email = this.email;
  }
  if (this.adresse && !this.contacts?.adresse) {
    this.contacts = this.contacts || {};
    this.contacts.adresse = this.adresse;
  }

  next();
});

// ✅ Même logique pour les updates via findByIdAndUpdate
enseignantSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // Sync matieres <-> matiere sur update
  if (update.$set) {
    if (update.$set.matieres && !update.$set.matiere) {
      update.$set.matiere = update.$set.matieres[0] || "";
    }
    if (update.$set.matiere && !update.$set.matieres) {
      update.$set.matieres = update.$set.matiere ? [update.$set.matiere] : [];
    }
  } else {
    if (update.matieres && !update.matiere) {
      update.matiere = update.matieres[0] || "";
    }
    if (update.matiere && !update.matieres) {
      update.matieres = update.matiere ? [update.matiere] : [];
    }
  }

  next();
});

// ==================== MÉTHODES ====================

// Ajouter une matière
enseignantSchema.methods.ajouterMatiere = function (matiere) {
  const m = String(matiere).trim();
  if (!m) return this;
  if (!this.matieres.includes(m)) {
    this.matieres.push(m);
    if (!this.matiere) this.matiere = m;
  }
  return this;
};

// Retirer une matière
enseignantSchema.methods.retirerMatiere = function (matiere) {
  this.matieres = this.matieres.filter((m) => m !== matiere);
  this.matiere = this.matieres[0] || "";
  return this;
};

// ==================== STATICS ====================

// Trouver les enseignants d'une matière donnée
enseignantSchema.statics.findByMatiere = function (matiere) {
  return this.find({
    $or: [
      { matieres: matiere },
      { matiere: matiere },
    ],
  });
};

// Trouver les enseignants actifs
enseignantSchema.statics.findActifs = function () {
  return this.find({ actif: true }).sort({ dateAjout: -1 });
};

// ==================== INDEX ====================
enseignantSchema.index({ matricule: 1 });
enseignantSchema.index({ nom: 1, prenom: 1 });
enseignantSchema.index({ matieres: 1 });
enseignantSchema.index({ email: 1 });

// ==================== EXPORT ====================
module.exports = mongoose.model('Enseignant', enseignantSchema);