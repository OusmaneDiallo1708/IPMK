const path = require('path');
const fs   = require('fs');
const fichierModel = require('../models/fichierModel');
const ObjectID     = require('mongoose').Types.ObjectId;

// ============================================================
// 📤 UPLOAD — Enregistrer un nouveau fichier
// ============================================================
module.exports.uploadFichier = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu.' });
    }
    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    const fichier = await fichierModel.create({
      nom: req.body.nom || req.file.originalname,
      nomOriginal: req.file.originalname,
      chemin: `/uploads/fichiers/${req.file.filename}`,
      typeMime: req.file.mimetype,
      extension: ext,
      taille: req.file.size,
      proprietaire: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Fichier enregistré avec succès.',
      fichier
    });
  } catch (error) {
    console.error('❌ uploadFichier:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// ============================================================
// 📋 LISTE — Voir ses fichiers + ceux autorisés (admin = tout)
// ============================================================
module.exports.listerFichiers = async (req, res) => {
  try {
    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);

    let query;
    if (isAdmin) {
      query = {};
    } else {
      query = {
        $or: [
          { proprietaire: req.user._id },
          { autorisations: req.user._id }
        ]
      };
    }

    const fichiers = await fichierModel
      .find(query)
      .populate('proprietaire', 'nomComplet email role')
      .populate('autorisations', 'nomComplet email')
      .populate('demandesAcces.demandeur', 'nomComplet email')
      .sort({ createdAt: -1 });

    const userId = req.user._id.toString();
    const data = fichiers.map(f => {
      const obj = f.toObject();
      obj.estProprietaire = f.proprietaire?._id?.toString() === userId;
      obj.estAutorise     = f.autorisations.some(u => u._id.toString() === userId);
      obj.maDemande       = f.demandesAcces.find(
        d => d.demandeur?._id?.toString() === userId
      ) || null;
      return obj;
    });

    res.status(200).json({ success: true, count: data.length, fichiers: data });
  } catch (error) {
    console.error('❌ listerFichiers:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// ⬇️ TÉLÉCHARGEMENT — Contrôle d'accès strict
// ============================================================
module.exports.telechargerFichier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectID.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    }

    const fichier = await fichierModel.findById(id);
    if (!fichier) {
      return res.status(404).json({ success: false, message: 'Fichier introuvable' });
    }

    const userId  = req.user._id.toString();
    const isOwner = fichier.proprietaire.toString() === userId;
    const isAuth  = fichier.autorisations.some(a => a.toString() === userId);
    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);

    if (!isOwner && !isAuth && !isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'NO_ACCESS',
        message: "Vous n'êtes pas autorisé à ouvrir ce fichier. Demandez une autorisation au propriétaire."
      });
    }

    const filePath = path.join(__dirname, '..', fichier.chemin);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Fichier physique introuvable' });
    }

    res.download(filePath, fichier.nomOriginal);
  } catch (error) {
    console.error('❌ telechargerFichier:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// 🙋 DEMANDER L'ACCÈS
// ============================================================
module.exports.demanderAcces = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectID.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    }

    const fichier = await fichierModel.findById(id);
    if (!fichier) {
      return res.status(404).json({ success: false, message: 'Fichier introuvable' });
    }

    const userId = req.user._id.toString();

    if (fichier.proprietaire.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Vous êtes déjà propriétaire.' });
    }

    if (fichier.autorisations.some(a => a.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà accès à ce fichier.' });
    }

    const dejaDemande = fichier.demandesAcces.find(
      d => d.demandeur.toString() === userId && d.statut === 'en_attente'
    );
    if (dejaDemande) {
      return res.status(400).json({ success: false, message: 'Une demande est déjà en attente.' });
    }

    fichier.demandesAcces.push({
      demandeur: req.user._id,
      message: (req.body.message || '').trim(),
      statut: 'en_attente'
    });
    await fichier.save();

    res.status(200).json({ success: true, message: 'Demande envoyée au propriétaire.' });
  } catch (error) {
    console.error('❌ demanderAcces:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// ✅ TRAITER UNE DEMANDE (propriétaire ou admin)
// ============================================================
module.exports.traiterDemande = async (req, res) => {
  try {
    const { id, demandeId } = req.params;
    const { action } = req.body; // 'approuvee' | 'refusee'

    if (!ObjectID.isValid(id) || !ObjectID.isValid(demandeId)) {
      return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    }
    if (!['approuvee', 'refusee'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action invalide.' });
    }

    const fichier = await fichierModel.findById(id);
    if (!fichier) {
      return res.status(404).json({ success: false, message: 'Fichier introuvable' });
    }

    const isOwner = fichier.proprietaire.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Seul le propriétaire peut traiter les demandes.' });
    }

    const demande = fichier.demandesAcces.id(demandeId);
    if (!demande) {
      return res.status(404).json({ success: false, message: 'Demande introuvable' });
    }

    demande.statut = action;
    demande.dateTraitement = new Date();

    if (action === 'approuvee') {
      const deja = fichier.autorisations.some(
        a => a.toString() === demande.demandeur.toString()
      );
      if (!deja) fichier.autorisations.push(demande.demandeur);
    }

    await fichier.save();

    res.status(200).json({
      success: true,
      message: action === 'approuvee' ? 'Accès approuvé ✅' : 'Accès refusé ❌'
    });
  } catch (error) {
    console.error('❌ traiterDemande:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// 🗑️ SUPPRIMER UN FICHIER
// ============================================================
module.exports.supprimerFichier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectID.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    }

    const fichier = await fichierModel.findById(id);
    if (!fichier) {
      return res.status(404).json({ success: false, message: 'Fichier introuvable' });
    }

    const isOwner = fichier.proprietaire.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé.' });
    }

    const filePath = path.join(__dirname, '..', fichier.chemin);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {
        console.warn('⚠️ Impossible de supprimer le fichier physique:', e.message);
      }
    }

    await fichierModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Fichier supprimé.' });
  } catch (error) {
    console.error('❌ supprimerFichier:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ============================================================
// 🔔 COMPTER LES DEMANDES EN ATTENTE (badge sidebar/notif)
// ============================================================
module.exports.compterDemandesEnAttente = async (req, res) => {
  try {
    const userId = req.user._id;
    const fichiers = await fichierModel.find({ proprietaire: userId });
    let total = 0;
    fichiers.forEach(f => {
      total += (f.demandesAcces || []).filter(d => d.statut === 'en_attente').length;
    });
    res.status(200).json({ success: true, total });
  } catch (error) {
    console.error('❌ compterDemandesEnAttente:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};