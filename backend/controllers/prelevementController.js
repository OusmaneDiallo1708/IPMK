const Prelevement = require('../models/Prelevement');
const Stock = require('../models/Stock');

// Créer un prélèvement et alimenter la caisse
exports.alimenterCaisse = async (req, res) => {
  try {
    const { montant } = req.body;
    if (!montant || montant <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }

    // Calculer le total des ventes
    const Vente = require('../models/venteModel');
    const ventes = await Vente.find({});
    const totalVentes = ventes.reduce((sum, v) => sum + (v.montantT || 0), 0);

    // Calculer le total des prélèvements déjà effectués
    const prelevements = await Prelevement.find({});
    const totalPreleve = prelevements.reduce((sum, p) => sum + p.montant, 0);

    const reste = totalVentes - totalPreleve;
    if (montant > reste) {
      return res.status(400).json({
        success: false,
        message: `Le montant ne peut pas dépasser le reste à prélever (${reste} GNF)`
      });
    }

    // 1. Créer le prélèvement
    const prelevement = new Prelevement({
      montant,
      effectuePar: req.user?._id
    });
    await prelevement.save();

    // 2. Créer une entrée de stock (Fluidité du cach)
    const { createStock } = require('./stockController');
    const stockReq = {
      body: {
        lieu: 'Alimentation caisse',
        detail: `Prélèvement de ${montant} GNF depuis les ventes`,
        type: 'entree',
        montant: montant,
        quantite: 1,
        prixUnitaire: montant
      },
      user: req.user
    };
    const stockRes = {
      status: (code) => ({
        json: (data) => data,
        send: (data) => data
      })
    };
    await createStock(stockReq, stockRes);

    res.status(201).json({
      success: true,
      message: `Caisse alimentée de ${montant} GNF. Total restant : ${reste - montant} GNF`,
      nouveauTotal: reste - montant
    });

  } catch (error) {
    console.error('Erreur alimenterCaisse:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer le total des prélèvements
exports.getTotalPreleve = async (req, res) => {
  try {
    const prelevements = await Prelevement.find({});
    const total = prelevements.reduce((sum, p) => sum + p.montant, 0);
    res.status(200).json({ success: true, totalPreleve: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};