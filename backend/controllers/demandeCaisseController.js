const DemandeCaisse = require('../models/DemandeCaisse');
const Stock = require('../models/Stock');
const mongoose = require('mongoose');

// 1. Créer une demande (employé)
exports.creerDemande = async (req, res) => {
  try {
    const { type, montant, lieu, detail, quantite, prixUnitaire } = req.body;
    if (!['entree', 'sortie'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type invalide' });
    }
    if (!montant || montant <= 0) {
      return res.status(400).json({ success: false, message: 'Montant requis > 0' });
    }
    const demande = await DemandeCaisse.create({
      type,
      montant,
      lieu,
      detail,
      quantite: quantite || 1,
      prixUnitaire: prixUnitaire || montant,
      demandeur: req.user._id,
      statut: 'en_attente'
    });
    res.status(201).json({ success: true, message: 'Demande soumise', data: demande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lister toutes les demandes (admin)
exports.getDemandes = async (req, res) => {
  try {
    const { statut, type } = req.query;
    const query = {};
    if (statut) query.statut = statut;
    if (type) query.type = type;
    const demandes = await DemandeCaisse.find(query)
      .populate('demandeur', 'nomComplet email')
      .populate('traitePar', 'nomComplet email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: demandes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Approuver une demande (admin) – crée le mouvement stock
exports.approuverDemande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const demande = await DemandeCaisse.findById(req.params.id).session(session);
    if (!demande || demande.statut !== 'en_attente') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Demande non disponible' });
    }

    // Vérifier stock suffisant pour une sortie
    if (demande.type === 'sortie') {
      const all = await Stock.find().sort({ date: 1 }).session(session);
      let total = 0;
      for (const s of all) {
        if (s.type === 'entree') total += s.montant;
        else if (s.type === 'sortie') total -= s.montant;
      }
      if (total < demande.montant) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant ! Solde actuel: ${total.toLocaleString()} GNF`
        });
      }
    }

    // Recalcul du total après ajout
    const allStocks = await Stock.find().sort({ date: 1 }).session(session);
    let totalActuel = 0;
    for (const s of allStocks) {
      if (s.type === 'entree') totalActuel += s.montant;
      else if (s.type === 'sortie') totalActuel -= s.montant;
    }
    const nouveauTotal = demande.type === 'entree' ? totalActuel + demande.montant : totalActuel - demande.montant;

    // Créer le mouvement de stock
    const stock = new Stock({
      date: new Date(),
      lieu: demande.lieu,
      detail: demande.detail,
      type: demande.type,
      montant: demande.montant,
      quantite: demande.quantite || 1,
      prixUnitaire: demande.prixUnitaire || demande.montant,
      montantTotal: nouveauTotal,
      quantiteTotal: 0
    });
    await stock.save({ session });

    // Mettre à jour la demande
    demande.statut = 'approuvee';
    demande.traitePar = req.user._id;
    demande.dateTraitement = new Date();
    demande.mouvementStockId = stock._id;
    await demande.save({ session });

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Demande approuvée', data: { demande, stock } });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// 4. Refuser une demande (admin)
exports.refuserDemande = async (req, res) => {
  try {
    const { commentaire } = req.body;
    const demande = await DemandeCaisse.findById(req.params.id);
    if (!demande || demande.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Demande non disponible' });
    }
    demande.statut = 'refusee';
    demande.traitePar = req.user._id;
    demande.dateTraitement = new Date();
    demande.commentaire = commentaire || 'Refusée';
    await demande.save();
    res.status(200).json({ success: true, message: 'Demande refusée', data: demande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Mes demandes (employé)
exports.getMesDemandes = async (req, res) => {
  try {
    const demandes = await DemandeCaisse.find({ demandeur: req.user._id })
      .populate('traitePar', 'nomComplet email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: demandes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ==================== SUPPRIMER UNE DEMANDE (uniquement si traitée) ====================
exports.supprimerDemande = async (req, res) => {
  try {
      const demande = await DemandeCaisse.findById(req.params.id);
      if (!demande) {
          return res.status(404).json({ success: false, message: 'Demande non trouvée' });
      }

      // ✅ Vérifier que la demande a déjà été traitée (approuvée ou refusée)
      if (demande.statut === 'en_attente') {
          return res.status(400).json({ 
              success: false, 
              message: 'Impossible de supprimer une demande en attente. Traitez-la d\'abord.' 
          });
      }

      await DemandeCaisse.findByIdAndDelete(req.params.id);

      res.status(200).json({
          success: true,
          message: 'Demande supprimée avec succès'
      });
  } catch (error) {
      console.error('❌ Erreur supprimerDemande:', error);
      res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== VIDER TOUTES LES DEMANDES TRAITÉES ====================
exports.viderDemandesTraitees = async (req, res) => {
  try {
      const result = await DemandeCaisse.deleteMany({
          statut: { $in: ['approuvee', 'refusee'] }
      });

      res.status(200).json({
          success: true,
          message: `${result.deletedCount} demande(s) traitée(s) supprimée(s) avec succès`,
          deletedCount: result.deletedCount
      });
  } catch (error) {
      console.error('❌ Erreur viderDemandesTraitees:', error);
      res.status(500).json({ success: false, message: error.message });
  }
};