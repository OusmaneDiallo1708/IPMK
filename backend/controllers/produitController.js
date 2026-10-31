const mongoose = require('mongoose');
const ObjectID = require('mongoose').Types.ObjectId;
const categorieModel = require('../models/categorieModel');
const produitModel = require('../models/produitModel');
const utilisateurModel = require('../models/utilisateurModel');
const path = require("path");
const fs = require("fs");

// ==================== AJOUTER UN PRODUIT ====================
module.exports.addProduits = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour ajouter un produit"
      });
    }

    const { 
      categorieId, 
      nom,
      description,
      quantite, 
      prixAchat, 
      prixVente, 
      stock_min, 
      date_ajout, 
      date_expiration,
      activerAlerteStock,
      autoriserModificationPrixVente 
    } = req.body;

    // ✅ Validations
    if (!categorieId) {
      return res.status(400).json({ success: false, message: "La catégorie est requise" });
    }
    if (!mongoose.Types.ObjectId.isValid(categorieId)) {
      return res.status(400).json({ success: false, message: "ID de catégorie invalide" });
    }
    const categorieExistante = await categorieModel.findById(categorieId);
    if (!categorieExistante) {
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });
    }

    const quantiteNum = Number(quantite);
    const prixAchatNum = Number(prixAchat);
    const prixVenteNum = Number(prixVente);
    const stockMinNum = Number(stock_min) || 5;

    if (isNaN(quantiteNum) || quantiteNum <= 0) {
      return res.status(400).json({ success: false, message: "Quantité invalide" });
    }
    if (isNaN(prixAchatNum) || prixAchatNum <= 0) {
      return res.status(400).json({ success: false, message: "Prix d'achat invalide" });
    }
    if (isNaN(prixVenteNum) || prixVenteNum <= 0) {
      return res.status(400).json({ success: false, message: "Prix de vente invalide" });
    }

    // Gestion de l'image
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // ✅ Création du produit
    const nouveauProduit = new produitModel({
      categorie: categorieId,
      categorieNom: categorieExistante.nom,
      categorieDescription: categorieExistante.description,
      nom: nom || categorieExistante.nom,
      description: description || '',
      quantite: quantiteNum,
      stock: quantiteNum,
      prixAchat: prixAchatNum,
      prixVente: prixVenteNum,
      stock_min: stockMinNum,
      date_ajout: date_ajout || new Date(),
      date_expiration: date_expiration || null,
      image: imagePath,
      utilisateur: user._id,
      activerAlerteStock: activerAlerteStock === 'true' || activerAlerteStock === true,
      autoriserModificationPrixVente: autoriserModificationPrixVente === 'true' || autoriserModificationPrixVente === true,
    });

    await nouveauProduit.save();

    res.status(201).json({
      success: true,
      message: "Produit ajouté avec succès",
      produit: nouveauProduit
    });

  } catch (error) {
    console.error("❌ Erreur addProduits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du produit",
      error: error.message
    });
  }
};

// ==================== LISTER TOUS LES PRODUITS ====================
module.exports.getAllProduits = async (req, res) => {
  try {
    const produits = await produitModel.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true,
      message: 'Voici la liste totale des produits',
      data: produits,   // ✅ uniformisé
      count: produits.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message 
    });
  }
};

// ==================== LISTER PRODUITS AVEC UTILISATEURS ====================
module.exports.getAllProduitsAvecUtilisateur = async (req, res) => {
  try {
    const produits = await produitModel.find()
      .populate({ path: 'categorie', select: 'nom description' })
      .sort({ date_ajout: -1 });

    res.status(200).json({ 
      success: true,
      message: "Liste des produits",
      data: produits,   // ✅ uniformisé
      count: produits.length
    });
  } catch (error) {
    console.error("Erreur getAllProduitsAvecUtilisateur :", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur",
      error: error.message 
    });
  }
};

// ==================== AFFICHER UN PRODUIT ====================
module.exports.getUnProduits = async (req, res) => {
  const produitId = req.params.id;
  
  if (!ObjectID.isValid(produitId)) {
    return res.status(400).json({ 
      success: false,
      message: "ID invalide" 
    });
  }
  
  try {
    const produit = await produitModel.findById(produitId)
      .populate('categorie', 'nom description')
      .populate('utilisateur', 'nomComplet email');
      
    if (!produit) {
      return res.status(404).json({ 
        success: false,
        message: "Produit non trouvé" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Produit récupéré avec succès",
      data: produit   // ✅ uniformisé
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message 
    });
  }
};

// ==================== MODIFIER UN PRODUIT ====================
module.exports.updateProduits = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour modifier un produit"
      });
    }

    const produitId = req.params.id;
    if (!ObjectID.isValid(produitId)) {
      return res.status(400).json({
        success: false,
        message: "ID invalide"
      });
    }

    const produit = await produitModel.findById(produitId);
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable"
      });
    }

    const isAdmin = user.role === 'admin' || user.role === 'superAdmin';
    if (!isAdmin && produit.utilisateur.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez modifier que vos produits"
      });
    }

    const {
      quantite,
      prixAchat,
      prixVente,
      stock_min,
      date_ajout,
      date_expiration,
      activerAlerteStock,
      autoriserModificationPrixVente
    } = req.body;

    const toBoolean = (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value === 'true' || value === '1';
      return Boolean(value);
    };

    const updateData = {
      quantite: Number(quantite),
      stock: Number(quantite),
      prixAchat: Number(prixAchat),
      prixVente: Number(prixVente),
      stock_min: Number(stock_min) || 5,
      date_ajout: date_ajout || produit.date_ajout,
      date_expiration: date_expiration || produit.date_expiration,
      activerAlerteStock: toBoolean(activerAlerteStock),
      autoriserModificationPrixVente: toBoolean(autoriserModificationPrixVente)
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const produitModifie = await produitModel.findByIdAndUpdate(
      produitId,
      updateData,
      { new: true, runValidators: true }
    );

    // ✅ Calcul de l'alerte avec prise en compte de activerAlerteStock
    produitModifie.alert_stock = produitModifie.activerAlerteStock 
      ? produitModifie.stock < produitModifie.stock_min 
      : false;

    await produitModifie.save();

    res.status(200).json({
      success: true,
      message: "Produit modifié avec succès",
      data: produitModifie   // ✅ uniformisé
    });

  } catch (error) {
    console.error("❌ Erreur updateProduits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

// ==================== SUPPRIMER UN PRODUIT ====================
module.exports.deleteProduits = async (req, res) => {
  const produitId = req.params.id;
  
  if (!ObjectID.isValid(produitId)) {
    return res.status(400).json({ 
      success: false,
      message: "ID invalide" 
    });
  }
  
  try {
    const produit = await produitModel.findByIdAndDelete(produitId);
    if (!produit) {
      return res.status(404).json({ 
        success: false,
        message: "Produit introuvable" 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: "Produit supprimé avec succès" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message 
    });
  }
};

// ==================== STATISTIQUES PRODUITS ====================
module.exports.getStatsProduits = async (req, res) => {
  try {
    const totalProduits = await produitModel.countDocuments();
    
    const totalQuantiteAgg = await produitModel.aggregate([
      { $group: { _id: null, total: { $sum: "$quantite" } } }
    ]);
    const totalQuantite = totalQuantiteAgg[0]?.total || 0;
    
    const valeurStockVenteAgg = await produitModel.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ["$stock", "$prixVente"] } } } }
    ]);
    const valeurStockVente = valeurStockVenteAgg[0]?.total || 0;
    
    const valeurStockAchatAgg = await produitModel.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ["$stock", "$prixAchat"] } } } }
    ]);
    const valeurStockAchat = valeurStockAchatAgg[0]?.total || 0;
    
    // ✅ FILTRE IMPORTANT : uniquement les produits avec alerte activée
    const produitsAlertes = await produitModel.find({ 
      activerAlerteStock: true,
      $expr: { $lt: ["$stock", "$stock_min"] } 
    });
    
    const produitsRupture = await produitModel.find({ stock: 0 });
    
    const produitsExpires = await produitModel.find({ 
      date_expiration: { $lt: new Date() },
      stock: { $gt: 0 }
    });
    
    const repartitionCategorie = await produitModel.aggregate([
      {
        $group: {
          _id: "$categorieNom",
          totalProduits: { $sum: 1 },
          quantiteTotale: { $sum: "$quantite" },
          valeurTotale: { $sum: { $multiply: ["$quantite", "$prixVente"] } }
        }
      },
      { $sort: { quantiteTotale: -1 } }
    ]);
    
    const produitsParMois = await produitModel.aggregate([
      { 
        $match: { date_ajout: { $exists: true, $ne: null } }
      },
      { 
        $group: { 
          _id: { 
            annee: { $year: "$date_ajout" }, 
            mois: { $month: "$date_ajout" } 
          }, 
          totalProduits: { $sum: 1 },
          quantiteTotale: { $sum: "$quantite" }
        } 
      },
      { $sort: { "_id.annee": 1, "_id.mois": 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Statistiques produits",
      data: {
        totalProduits,
        totalQuantite,
        valeurStockVente,
        valeurStockAchat,
        produitsAlertes: produitsAlertes.length,
        produitsRupture: produitsRupture.length,
        produitsExpires: produitsExpires.length,
        produitsAlertesListe: produitsAlertes.map(prod => ({
          _id: prod._id,
          categorieNom: prod.categorieNom,
          stock: prod.stock,
          stock_min: prod.stock_min
        })),
        repartitionCategorie,
        evolution: {
          produitsParMois: produitsParMois.map(item => ({
            annee: item._id.annee,
            mois: item._id.mois,
            label: `${item._id.mois.toString().padStart(2, '0')}/${item._id.annee}`,
            totalProduits: item.totalProduits,
            quantiteTotale: item.quantiteTotale
          }))
        }
      }
    });

  } catch (error) {
    console.error("Erreur statistiques:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message 
    });
  }
};