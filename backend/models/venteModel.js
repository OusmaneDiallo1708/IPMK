const mongoose = require('mongoose');

const venteSchema = new mongoose.Schema(
  {
    produit: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'produit', 
      required: [true, 'Le produit est requis']
    },
    produitNom: { 
      type: String, 
      required: [true, 'Le nom du produit est requis'],
      trim: true
    },
    produitDescription: { 
      type: String, 
      default: '',
      trim: true
    },
    utilisateur: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Utilisateur',
      required: [true, "L'utilisateur est requis"]
    },
    utilisateurNom: { 
      type: String, 
      required: [true, "Le nom de l'utilisateur est requis"],
      trim: true
    },
    quantite: { 
      type: Number, 
      required: [true, 'La quantité est requise'],
      min: [1, 'La quantité doit être au moins 1']
    },
    prix_unitaire: { 
      type: Number, 
      required: [true, 'Le prix unitaire est requis'],
      min: [0, 'Le prix unitaire doit être positif']
    },
    montantT: { 
      type: Number,
      default: 0
    },
    date_vente: { 
      type: Date, 
      default: Date.now
    },
    montantEncaissé: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true 
  }
);

// ✅ Middleware pre-save pour calculer automatiquement le montantT
venteSchema.pre('save', function(next) {
  if (this.quantite && this.prix_unitaire) {
    this.montantT = this.quantite * this.prix_unitaire;
  }
  next();
});

// ✅ Middleware pre-findOneAndUpdate pour mettre à jour montantT
venteSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.$set) {
    if (update.$set.quantite && update.$set.prix_unitaire) {
      update.$set.montantT = update.$set.quantite * update.$set.prix_unitaire;
    }
  } else if (update.quantite && update.prix_unitaire) {
    update.montantT = update.quantite * update.prix_unitaire;
  }
  next();
});

// ✅ Méthodes statiques (inchangées, elles sont bonnes)
venteSchema.statics.getTotalVentesParJour = async function(debut, fin) {
  const match = {};
  if (debut && fin) {
    match.date_vente = { $gte: new Date(debut), $lte: new Date(fin) };
  }
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date_vente' } },
        totalVentes: { $sum: '$montantT' },
        quantiteTotale: { $sum: '$quantite' },
        nombreVentes: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

venteSchema.statics.getTotalVentesParMois = async function(annee) {
  const match = {};
  if (annee) {
    const startDate = new Date(parseInt(annee), 0, 1);
    const endDate = new Date(parseInt(annee), 11, 31, 23, 59, 59);
    match.date_vente = { $gte: startDate, $lte: endDate };
  }
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          annee: { $year: '$date_vente' },
          mois: { $month: '$date_vente' }
        },
        totalVentes: { $sum: '$montantT' },
        quantiteTotale: { $sum: '$quantite' },
        nombreVentes: { $sum: 1 }
      }
    },
    { $sort: { '_id.annee': -1, '_id.mois': -1 } }
  ]);
};

venteSchema.statics.getTotalVentesParAnnee = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: { $year: '$date_vente' },
        totalVentes: { $sum: '$montantT' },
        quantiteTotale: { $sum: '$quantite' },
        nombreVentes: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

const venteModel = mongoose.model('vente', venteSchema);
module.exports = venteModel;