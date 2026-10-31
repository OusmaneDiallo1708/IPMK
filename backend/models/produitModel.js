const mongoose = require("mongoose");

const produitSchema = new mongoose.Schema({
  // 🔗 Référence à la catégorie
  categorie: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Categorie'
  },
  
  // 📌 Infos produit
  categorieNom: { type: String, required: true },
  
  description: {
    type: String,
    trim: true
  },
  
  // 📦 Stock
  quantite: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  
  stock_min: { 
    type: Number, 
    default: 5
  },
  
  // 💰 Prix
  prixVente: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  prixAchat: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // 🖼️ Image
  image: { 
    type: String,
    default: null
  },
  
  // 📅 Date d'expiration
  date_expiration: { 
    type: Date
  },
   // ✅ Nouveaux champs
   activerAlerteStock: {
    type: Boolean,
    default: true
  },
  autoriserModificationPrixVente: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});


const produitModel = mongoose.model('Produit', produitSchema);
module.exports = produitModel;