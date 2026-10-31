const mongoose = require('mongoose');
const approvisionnementModel = require('../models/approvisionnementModel');
const venteUtilisateurModel = require('../models/venteUtilisateurModel');
const produitModel = require('../models/produitModel');
const venteModel = require('../models/venteModel');
const utilisateurModel = require('../models/utilisateurModel');

// ==================== APPROVISIONNER UN UTILISATEUR ====================
module.exports.approvisionnerUtilisateur = async (req, res) => {
  try {
    const admin = res.locals.user;
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Seul l'administrateur peut faire des approvisionnements"
      });
    }

    const { produitId, utilisateurId, quantite, prixAchat, prixVente, stockMin, dateExpiration } = req.body;

    if (!produitId || !utilisateurId || !quantite || !prixAchat || !prixVente) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis: produitId, utilisateurId, quantite, prixAchat, prixVente"
      });
    }

    const produit = await produitModel.findById(produitId);
    if (!produit) {
      return res.status(404).json({ success: false, message: "Produit non trouvé" });
    }

    const utilisateur = await utilisateurModel.findById(utilisateurId);
    if (!utilisateur) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const approvisionnementExistant = await approvisionnementModel.findOne({
      produit: produitId,
      utilisateur: utilisateurId,
      statut: 'actif'
    });

    if (approvisionnementExistant) {
      approvisionnementExistant.quantite += parseInt(quantite);
      approvisionnementExistant.stockRestant += parseInt(quantite);
      approvisionnementExistant.prixAchat = prixAchat;
      approvisionnementExistant.prixVente = prixVente;
      await approvisionnementExistant.save();

      return res.status(200).json({
        success: true,
        message: `Stock ajouté à l'approvisionnement existant de ${utilisateur.nomComplet}`,
        approvisionnement: approvisionnementExistant
      });
    }

    const nouvelApprovisionnement = new approvisionnementModel({
      produit: produitId,
      produitNom: produit.categorieNom,
      prixAchat: parseFloat(prixAchat),
      prixVente: parseFloat(prixVente),
      quantite: parseInt(quantite),
      stockRestant: parseInt(quantite),
      stockMin: stockMin || 5,
      utilisateur: utilisateurId,
      utilisateurNom: utilisateur.nomComplet,
      approvisionnePar: admin._id,
      approvisionneParNom: admin.nomComplet,
      dateExpiration: dateExpiration || null
    });

    await nouvelApprovisionnement.save();

    res.status(201).json({
      success: true,
      message: `${utilisateur.nomComplet} a reçu ${quantite} ${produit.categorieNom}(s)`,
      approvisionnement: nouvelApprovisionnement
    });

  } catch (error) {
    console.error("Erreur approvisionnement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'approvisionnement",
      error: error.message
    });
  }
};

// ==================== VOIR MON STOCK ====================
module.exports.getMonStock = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour voir votre stock"
      });
    }

    const stocks = await approvisionnementModel.find({
      utilisateur: user._id,
      stockRestant: { $gt: 0 },
      statut: 'actif'
    })
    .populate({
      path: 'produit',
      model: 'Produit',
      select: 'autoriserModificationPrixVente categorieNom prixVente prixAchat stock_min'
    })
    .sort({ dateApprovisionnement: -1 });

    const stocksAvecAutorisation = stocks.map(stock => {
      const stockObj = stock.toObject();
      stockObj.autoriserModificationPrixVente = stock.produit?.autoriserModificationPrixVente || false;
      return stockObj;
    });

    const valeurTotaleStock = stocksAvecAutorisation.reduce((total, stock) => {
      return total + (stock.stockRestant * stock.prixVente);
    }, 0);

    const produitsUniques = new Set(stocksAvecAutorisation.map(s => s.produit?.toString())).size;

    res.status(200).json({
      success: true,
      message: "Votre stock personnel",
      stocks: stocksAvecAutorisation,
      totalProduits: stocksAvecAutorisation.length,
      produitsUniques,
      valeurTotaleStock
    });

  } catch (error) {
    console.error("❌ Erreur getMonStock:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de votre stock",
      error: error.message
    });
  }
};

// ==================== ENREGISTRER UNE VENTE ====================
module.exports.enregistrerVente = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour enregistrer une vente"
      });
    }

    const {
      approvisionnementId,
      quantite,
      clientNom,
      modePaiement,
      montantPaye,
      resteAPayer,
      prix_unitaire
    } = req.body;

    if (!approvisionnementId || !quantite || quantite <= 0) {
      return res.status(400).json({
        success: false,
        message: "Approvisionnement ID et quantité valide requis"
      });
    }

    const approvisionnement = await approvisionnementModel.findOne({
      _id: approvisionnementId,
      utilisateur: user._id
    }).populate({
      path: 'produit',
      model: 'Produit',
      select: 'autoriserModificationPrixVente prixVente'
    });

    if (!approvisionnement) {
      return res.status(404).json({
        success: false,
        message: "Approvisionnement non trouvé ou vous n'y avez pas accès"
      });
    }

    if (approvisionnement.stockRestant < quantite) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Il reste ${approvisionnement.stockRestant} unités`
      });
    }

    const produit = approvisionnement.produit;
    let prixEffectif = approvisionnement.prixVente;

    if (prix_unitaire && produit?.autoriserModificationPrixVente) {
      prixEffectif = parseFloat(prix_unitaire);
    } else if (prix_unitaire && prix_unitaire !== approvisionnement.prixVente) {
      return res.status(400).json({
        success: false,
        message: `Modification du prix non autorisée pour ce produit. Prix fixe : ${approvisionnement.prixVente} GNF`
      });
    }

    const montantTotal = quantite * prixEffectif;

    let finalMode = modePaiement || 'comptant';
    let finalMontantPaye = montantPaye || 0;
    let finalResteAPayer = resteAPayer || 0;

    if (finalMode === 'comptant') {
      finalMontantPaye = montantTotal;
      finalResteAPayer = 0;
    } else if (finalMode === 'credit') {
      finalMontantPaye = 0;
      finalResteAPayer = montantTotal;
    } else if (finalMode === 'partiel') {
      if (finalMontantPaye > montantTotal) finalMontantPaye = montantTotal;
      finalResteAPayer = montantTotal - finalMontantPaye;
    }

    const vente = new venteUtilisateurModel({
      approvisionnement: approvisionnementId,
      produit: approvisionnement.produit,
      produitNom: approvisionnement.produitNom,
      utilisateur: user._id,
      utilisateurNom: user.nomComplet,
      quantite: quantite,
      prixVente: prixEffectif,
      montantTotal: montantTotal,
      clientNom: clientNom || null,
      dateVente: new Date(),
      modePaiement: finalMode,
      montantPaye: finalMontantPaye,
      resteAPayer: finalResteAPayer
    });

    await vente.save();

    approvisionnement.stockRestant -= quantite;
    if (approvisionnement.stockRestant === 0) {
      approvisionnement.statut = 'epuise';
    }
    await approvisionnement.save();

    res.status(201).json({
      success: true,
      message: `Vente de ${quantite} ${approvisionnement.produitNom}(s) enregistrée avec succès`,
      vente: vente,
      stockRestant: approvisionnement.stockRestant,
      montantTotal: montantTotal
    });

  } catch (error) {
    console.error("Erreur enregistrerVente:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement de la vente",
      error: error.message
    });
  }
};

// ==================== MES VENTES ====================
module.exports.getMesVentes = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour voir vos ventes"
      });
    }

    const ventes = await venteUtilisateurModel.find({ utilisateur: user._id })
      .sort({ dateVente: -1 });

    const ventesParProduit = {};
    for (const vente of ventes) {
      const produitNom = vente.produitNom || 'Produit inconnu';
      if (!ventesParProduit[produitNom]) {
        ventesParProduit[produitNom] = {
          produitNom: produitNom,
          quantiteTotale: 0,
          montantTotal: 0,
          nombreVentes: 0
        };
      }
      ventesParProduit[produitNom].quantiteTotale += vente.quantite;
      ventesParProduit[produitNom].montantTotal += vente.montantTotal;
      ventesParProduit[produitNom].nombreVentes += 1;
    }

    const totalGeneral = ventes.reduce((total, vente) => total + vente.montantTotal, 0);
    const quantiteTotale = ventes.reduce((total, vente) => total + vente.quantite, 0);

    res.status(200).json({
      success: true,
      message: "Vos ventes",
      ventes: ventes,
      totalVentes: ventes.length,
      quantiteTotale: quantiteTotale,
      montantTotal: totalGeneral,
      ventesParProduit: Object.values(ventesParProduit)
    });

  } catch (error) {
    console.error("Erreur getMesVentes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos ventes",
      error: error.message
    });
  }
};

// ==================== STATISTIQUES ADMIN ====================
module.exports.getStatsAdmin = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé à l'administrateur"
      });
    }

    const toutesVentes = await venteUtilisateurModel.find()
      .populate('utilisateur', 'nomComplet email role')
      .populate({
        path: 'produit',
        model: 'Produit',
        select: 'categorieNom'
      })
      .sort({ dateVente: -1 });

    const totalGeneral = toutesVentes.reduce((total, vente) => total + vente.montantTotal, 0);
    const quantiteTotale = toutesVentes.reduce((total, vente) => total + vente.quantite, 0);

    const ventesParUtilisateur = {};
    for (const vente of toutesVentes) {
      const nomUtilisateur = vente.utilisateur?.nomComplet || 'Inconnu';
      if (!ventesParUtilisateur[nomUtilisateur]) {
        ventesParUtilisateur[nomUtilisateur] = {
          utilisateurNom: nomUtilisateur,
          utilisateurId: vente.utilisateur?._id,
          quantiteTotale: 0,
          montantTotal: 0,
          ventesParProduit: {}
        };
      }
      ventesParUtilisateur[nomUtilisateur].quantiteTotale += vente.quantite;
      ventesParUtilisateur[nomUtilisateur].montantTotal += vente.montantTotal;

      const produitNom = vente.produitNom || 'Inconnu';
      if (!ventesParUtilisateur[nomUtilisateur].ventesParProduit[produitNom]) {
        ventesParUtilisateur[nomUtilisateur].ventesParProduit[produitNom] = {
          produitNom: produitNom,
          quantiteTotale: 0,
          montantTotal: 0
        };
      }
      ventesParUtilisateur[nomUtilisateur].ventesParProduit[produitNom].quantiteTotale += vente.quantite;
      ventesParUtilisateur[nomUtilisateur].ventesParProduit[produitNom].montantTotal += vente.montantTotal;
    }

    const ventesParProduit = {};
    for (const vente of toutesVentes) {
      const produitNom = vente.produitNom || 'Produit inconnu';
      if (!ventesParProduit[produitNom]) {
        ventesParProduit[produitNom] = {
          produitNom: produitNom,
          quantiteTotale: 0,
          montantTotal: 0
        };
      }
      ventesParProduit[produitNom].quantiteTotale += vente.quantite;
      ventesParProduit[produitNom].montantTotal += vente.montantTotal;
    }

    const stocksActuels = await approvisionnementModel.find({ stockRestant: { $gt: 0 } })
      .populate('utilisateur', 'nomComplet');

    const stockParUtilisateur = {};
    for (const stock of stocksActuels) {
      const nomUtilisateur = stock.utilisateur?.nomComplet || 'Inconnu';
      if (!stockParUtilisateur[nomUtilisateur]) {
        stockParUtilisateur[nomUtilisateur] = {
          utilisateurNom: nomUtilisateur,
          utilisateurId: stock.utilisateur?._id,
          valeurTotaleStock: 0,
          produits: []
        };
      }
      stockParUtilisateur[nomUtilisateur].valeurTotaleStock += stock.stockRestant * stock.prixVente;
      stockParUtilisateur[nomUtilisateur].produits.push({
        produitNom: stock.produitNom,
        stockRestant: stock.stockRestant,
        prixVente: stock.prixVente,
        valeur: stock.stockRestant * stock.prixVente
      });
    }

    res.status(200).json({
      success: true,
      message: "Statistiques globales des ventes",
      totalVentes: toutesVentes.length,
      quantiteTotale: quantiteTotale,
      montantTotal: totalGeneral,
      ventesParUtilisateur: Object.values(ventesParUtilisateur).map(u => ({
        ...u,
        ventesParProduit: Object.values(u.ventesParProduit)
      })),
      ventesParProduit: Object.values(ventesParProduit),
      stockParUtilisateur: Object.values(stockParUtilisateur),
      toutesVentes: toutesVentes
    });

  } catch (error) {
    console.error("Erreur getStatsAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

// ==================== LISTE DES APPROVISIONNEMENTS (admin) ====================
module.exports.getApprovisionnements = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé à l'administrateur"
      });
    }

    const { utilisateurId } = req.query;
    let filter = {};
    if (utilisateurId) filter.utilisateur = utilisateurId;

    const approvisionnements = await approvisionnementModel.find(filter)
      .populate('utilisateur', 'nomComplet email')
      .populate({
        path: 'produit',
        model: 'Produit',
        select: 'categorieNom nom'
      })
      .sort({ dateApprovisionnement: -1 });

    const formatted = approvisionnements.map(app => ({
      _id: app._id,
      dateApprovisionnement: app.dateApprovisionnement || app.createdAt,
      utilisateurNom: app.utilisateur?.nomComplet || 'Utilisateur inconnu',
      produitNom: app.produit?.categorieNom || app.produit?.nom || 'Produit inconnu',
      quantite: app.quantite,
      prixAchat: app.prixAchat,
      prixVente: app.prixVente,
      stockRestant: app.stockRestant,
      statut: app.statut
    }));

    res.status(200).json({
      success: true,
      approvisionnements: formatted,
      count: formatted.length
    });
  } catch (error) {
    console.error("Erreur getApprovisionnements:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de la récupération"
    });
  }
};

// ==================== VOIR LE STOCK D'UN UTILISATEUR (admin) ====================
module.exports.getStockUtilisateur = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé à l'administrateur"
      });
    }

    const { userId } = req.params;
    const stocks = await approvisionnementModel.find({
      utilisateur: userId,
      stockRestant: { $gt: 0 }
    }).populate('utilisateur', 'nomComplet email');

    const valeurTotaleStock = stocks.reduce((total, stock) => {
      return total + (stock.stockRestant * stock.prixVente);
    }, 0);

    res.status(200).json({
      success: true,
      stocks: stocks,
      totalProduits: stocks.length,
      valeurTotaleStock: valeurTotaleStock
    });

  } catch (error) {
    console.error("Erreur getStockUtilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du stock",
      error: error.message
    });
  }
};

// ==================== DEMANDER LE DÉPÔT EN CAISSE ====================
module.exports.demanderDepotCaisse = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour faire une demande"
      });
    }

    const { venteId } = req.params;
    const venteUtilisateur = await venteUtilisateurModel.findById(venteId);
    if (!venteUtilisateur) {
      return res.status(404).json({ success: false, message: "Vente non trouvée" });
    }

    if (venteUtilisateur.utilisateur.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Action non autorisée" });
    }

    if (venteUtilisateur.statut !== 'active') {
      return res.status(400).json({
        success: false,
        message: "Cette vente ne peut pas être déposée (elle a déjà été traitée)"
      });
    }

    if (venteUtilisateur.demandeDepot.demandee) {
      return res.status(400).json({
        success: false,
        message: "Une demande de dépôt a déjà été faite pour cette vente, en attente de validation"
      });
    }

    venteUtilisateur.demandeDepot = {
      demandee: true,
      dateDemande: new Date(),
      valideePar: null,
      valideeParNom: null,
      dateValidation: null
    };
    venteUtilisateur.statut = 'depot_attente';
    await venteUtilisateur.save();

    res.status(200).json({
      success: true,
      message: `📤 Demande de dépôt envoyée à l'administrateur pour ${venteUtilisateur.montantTotal.toLocaleString()} GNF`,
      vente: venteUtilisateur
    });

  } catch (error) {
    console.error("Erreur demanderDepotCaisse:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== VALIDER LE DÉPÔT EN CAISSE ====================
module.exports.validerDepotCaisse = async (req, res) => {
  try {
    const admin = res.locals.user;
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Seul l'administrateur peut valider les dépôts en caisse"
      });
    }

    const { venteId } = req.params;
    const venteUtilisateur = await venteUtilisateurModel.findById(venteId);
    if (!venteUtilisateur) {
      return res.status(404).json({ success: false, message: "Vente non trouvée" });
    }

    if (!venteUtilisateur.demandeDepot.demandee || venteUtilisateur.statut !== 'depot_attente') {
      return res.status(400).json({
        success: false,
        message: "Aucune demande de dépôt en attente pour cette vente"
      });
    }

    const venteExistante = await venteModel.findOne({
      produit: venteUtilisateur.produit,
      utilisateur: venteUtilisateur.utilisateur,
      quantite: venteUtilisateur.quantite,
      prix_unitaire: venteUtilisateur.prixVente,
      date_vente: venteUtilisateur.dateVente
    });

    if (venteExistante) {
      return res.status(400).json({
        success: false,
        message: "Cette vente a déjà été déposée en caisse"
      });
    }

    const produit = await produitModel.findById(venteUtilisateur.produit);
    const nouvelleVenteCaisse = new venteModel({
      produit: venteUtilisateur.produit,
      produitNom: venteUtilisateur.produitNom,
      produitDescription: produit?.description || '',
      utilisateur: venteUtilisateur.utilisateur,
      utilisateurNom: venteUtilisateur.utilisateurNom,
      quantite: venteUtilisateur.quantite,
      prix_unitaire: venteUtilisateur.prixVente,
      montantT: venteUtilisateur.montantTotal,
      date_vente: venteUtilisateur.dateVente
    });

    await nouvelleVenteCaisse.save();

    if (produit) {
      produit.quantite -= venteUtilisateur.quantite;
      if (produit.quantite < 0) produit.quantite = 0;
      await produit.save();
    }

    venteUtilisateur.demandeDepot.valideePar = admin._id;
    venteUtilisateur.demandeDepot.valideeParNom = admin.nomComplet;
    venteUtilisateur.demandeDepot.dateValidation = new Date();
    venteUtilisateur.statut = 'depot_valide';
    venteUtilisateur.dateDepotCaisse = new Date();
    await venteUtilisateur.save();

    res.status(200).json({
      success: true,
      message: `✅ Dépôt de ${venteUtilisateur.montantTotal.toLocaleString()} GNF validé par ${admin.nomComplet}`,
      vente: venteUtilisateur
    });

  } catch (error) {
    console.error("Erreur validerDepotCaisse:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== LISTE DES DEMANDES DE DÉPÔT ====================
module.exports.getDemandesDepot = async (req, res) => {
  try {
    const admin = res.locals.user;
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé à l'administrateur"
      });
    }

    const demandes = await venteUtilisateurModel.find({
      statut: 'depot_attente',
      'demandeDepot.demandee': true
    }).populate('utilisateur', 'nomComplet email');

    res.status(200).json({
      success: true,
      demandes: demandes,
      count: demandes.length
    });

  } catch (error) {
    console.error("Erreur getDemandesDepot:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ANNULER UNE VENTE ====================
module.exports.annulerVente = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Connectez-vous pour annuler une vente"
      });
    }

    const { venteId } = req.params;
    const venteUtilisateur = await venteUtilisateurModel.findById(venteId);
    if (!venteUtilisateur) {
      return res.status(404).json({ success: false, message: "Vente non trouvée" });
    }

    if (venteUtilisateur.utilisateur.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Vous ne pouvez annuler que vos propres ventes" });
    }

    if (venteUtilisateur.statut !== 'active') {
      return res.status(400).json({ success: false, message: "Cette vente ne peut plus être annulée" });
    }

    const approvisionnement = await approvisionnementModel.findById(venteUtilisateur.approvisionnement);
    if (approvisionnement) {
      approvisionnement.stockRestant += venteUtilisateur.quantite;
      if (approvisionnement.statut === 'epuise') {
        approvisionnement.statut = 'actif';
      }
      await approvisionnement.save();
    }

    const produit = await produitModel.findById(venteUtilisateur.produit);
    if (produit) {
      produit.quantite += venteUtilisateur.quantite;
      await produit.save();
    }

    const ventePrincipale = await venteModel.findOne({
      produit: venteUtilisateur.produit,
      utilisateur: user._id,
      quantite: venteUtilisateur.quantite,
      montantT: venteUtilisateur.montantTotal
    }).sort({ createdAt: -1 });

    if (ventePrincipale) {
      await venteModel.findByIdAndDelete(ventePrincipale._id);
    }

    await venteUtilisateurModel.findByIdAndDelete(venteId);

    res.status(200).json({
      success: true,
      message: `❌ Vente de ${venteUtilisateur.quantite} ${venteUtilisateur.produitNom}(s) annulée et stock remboursé`,
      action: "annulee"
    });

  } catch (error) {
    console.error("Erreur annulerVente:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de la vente",
      error: error.message
    });
  }
};

// ==================== RÉGLER LE RESTE DÛ D'UNE VENTE ====================
module.exports.reglerReste = async (req, res) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Connectez-vous" });
    }

    const { venteId } = req.params;
    const { montantPaye } = req.body;

    if (!montantPaye || montantPaye <= 0) {
      return res.status(400).json({ success: false, message: "Montant invalide" });
    }

    const vente = await venteUtilisateurModel.findById(venteId);
    if (!vente) {
      return res.status(404).json({ success: false, message: "Vente non trouvée" });
    }

    if (vente.utilisateur.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Action non autorisée" });
    }

    if (vente.statut !== 'active') {
      return res.status(400).json({ success: false, message: "Cette vente ne peut pas être modifiée" });
    }

    if (vente.resteAPayer <= 0) {
      return res.status(400).json({ success: false, message: "Déjà entièrement payée" });
    }

    let nouveauMontantPaye = vente.montantPaye + montantPaye;
    if (nouveauMontantPaye > vente.montantTotal) {
      return res.status(400).json({ success: false, message: "Le total payé dépasse le montant de la vente" });
    }

    vente.montantPaye = nouveauMontantPaye;
    vente.resteAPayer = vente.montantTotal - nouveauMontantPaye;

    if (vente.resteAPayer === 0) {
      vente.modePaiement = 'comptant';
    }

    await vente.save();

    res.status(200).json({
      success: true,
      message: `✅ Paiement de ${montantPaye.toLocaleString()} GNF enregistré. Reste dû : ${vente.resteAPayer.toLocaleString()} GNF`,
      vente
    });
  } catch (error) {
    console.error("Erreur reglerReste:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== MODIFIER UN APPROVISIONNEMENT ====================
module.exports.updateApprovisionnement = async (req, res) => {
  try {
    const admin = res.locals.user;
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Seul l'administrateur peut modifier un approvisionnement"
      });
    }

    const { id } = req.params;
    const { quantite, prixAchat, prixVente, stockMin, dateExpiration } = req.body;

    const approvisionnement = await approvisionnementModel.findById(id);
    if (!approvisionnement) {
      return res.status(404).json({ success: false, message: "Approvisionnement non trouvé" });
    }

    if (quantite !== undefined) {
      const diff = parseInt(quantite) - approvisionnement.quantite;
      approvisionnement.quantite = parseInt(quantite);
      approvisionnement.stockRestant += diff;
      if (approvisionnement.stockRestant < 0) approvisionnement.stockRestant = 0;
    }
    if (prixAchat !== undefined) approvisionnement.prixAchat = parseFloat(prixAchat);
    if (prixVente !== undefined) approvisionnement.prixVente = parseFloat(prixVente);
    if (stockMin !== undefined) approvisionnement.stockMin = parseInt(stockMin);
    if (dateExpiration !== undefined) approvisionnement.dateExpiration = dateExpiration || null;

    await approvisionnement.save();

    res.status(200).json({
      success: true,
      message: "Approvisionnement modifié avec succès",
      approvisionnement
    });

  } catch (error) {
    console.error("Erreur updateApprovisionnement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification",
      error: error.message
    });
  }
};

// ==================== SUPPRIMER UN APPROVISIONNEMENT ====================
module.exports.deleteApprovisionnement = async (req, res) => {
  try {
    const admin = res.locals.user;
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Seul l'administrateur peut supprimer un approvisionnement"
      });
    }

    const { id } = req.params;
    const approvisionnement = await approvisionnementModel.findById(id);
    if (!approvisionnement) {
      return res.status(404).json({ success: false, message: "Approvisionnement non trouvé" });
    }

    await approvisionnementModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Approvisionnement supprimé avec succès"
    });

  } catch (error) {
    console.error("Erreur deleteApprovisionnement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: error.message
    });
  }
};

// ==================== RÉCUPÉRER TOUS LES APPROVISIONNEMENTS AVEC DÉTAILS ====================
// ==================== RÉCUPÉRER TOUS LES APPROVISIONNEMENTS AVEC DÉTAILS ====================
module.exports.getAllApprovisionnements = async (req, res) => {
  try {
    const admin = res.locals.user;
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superAdmin')) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé à l'administrateur"
      });
    }

    // ✅ Spécifier le modèle 'Produit' explicitement
    const approvisionnements = await approvisionnementModel.find()
      .populate('utilisateur', 'nomComplet email')
      .populate({
        path: 'produit',
        model: 'Produit',          // ← Nom exact du modèle
        select: 'categorieNom'
      })
      .sort({ createdAt: -1 });    // ← Utilisation de createdAt (toujours présent)

    res.status(200).json({
      success: true,
      approvisionnements
    });

  } catch (error) {
    console.error("❌ Erreur getAllApprovisionnements:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des approvisionnements",
      error: error.message
    });
  }
};