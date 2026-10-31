// ==================== controllers/inscriptionController.js ====================
const InscriptionModel = require('../models/InscriptionModel');
const EtudiantModel = require('../models/EtudiantModel');
const Paiement = require('../models/Paiement');
const mongoose = require('mongoose');

// ==================================================
// ============ HELPER : NUMÉRO REÇU AUTO ===========
// ==================================================
async function genererNumeroRecu() {
  const annee = new Date().getFullYear();
  const prefix = `REC${annee}`;
  const dernier = await Paiement
    .findOne({ numeroRecu: new RegExp(`^${prefix}`) })
    .sort({ numeroRecu: -1 });

  let numero = 1;
  if (dernier?.numeroRecu) {
    const n = parseInt(dernier.numeroRecu.replace(prefix, ''), 10);
    if (!isNaN(n)) numero = n + 1;
  }
  return `${prefix}${String(numero).padStart(5, '0')}`;
}

// ==================================================
// ============ AJOUTER UNE INSCRIPTION =============
// ✅ Inscription + Paiement auto (frais d'inscription)
// ✅ Comptable autorisé (cohérent avec allRoute.js)
// ==================================================
module.exports.ajoutInscription = async (req, res) => {
  // ✅ Sécurité : admin / superAdmin / Comptable
  if (!req.user || !['admin', 'superAdmin', 'Comptable'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Accès non autorisé. Seuls les administrateurs et comptables peuvent inscrire un étudiant."
    });
  }

  try {
    const {
      etudiantId,
      classe,
      niveau,
      option,
      anneeScolaire,
      fraisInscription,
      dateInscription,
    } = req.body;

    if (!etudiantId || !classe || !anneeScolaire) {
      return res.status(400).json({
        success: false,
        message: "Étudiant, classe et année scolaire sont obligatoires."
      });
    }

    const etudiant = await EtudiantModel.findById(etudiantId);
    if (!etudiant) {
      return res.status(404).json({ success: false, message: "Étudiant non trouvé" });
    }

    const frais = Number(fraisInscription) || 0;
    const dateInscr = dateInscription ? new Date(dateInscription) : new Date();

    const dejaInscrit = await InscriptionModel.findOne({
      etudiant: etudiantId,
      anneeScolaire: anneeScolaire.trim(),
      statut: 'validee',
    });
    if (dejaInscrit) {
      return res.status(400).json({
        success: false,
        message: `Cet étudiant est déjà inscrit en ${anneeScolaire}.`,
      });
    }

    // ✅ 1. Créer l'inscription
    const inscription = new InscriptionModel({
      etudiant: etudiantId,
      classe: classe.trim(),
      niveau: niveau?.trim() || null,
      option: option?.trim() || null,
      anneeScolaire: anneeScolaire.trim(),
      fraisInscription: frais,
      dateInscription: dateInscr,
      statut: 'validee',
    });
    await inscription.save();

    // ✅ 2. Mettre à jour l'étudiant
    etudiant.inscrit = true;
    etudiant.anneeInscriptionActuelle = anneeScolaire.trim();
    etudiant.derniereClasse = classe.trim();
    etudiant.dernierNiveau = niveau?.trim() || null;
    etudiant.derniereOption = option?.trim() || null;
    etudiant.derniereInscriptionId = inscription._id;
    etudiant.nombreInscriptions = (etudiant.nombreInscriptions || 0) + 1;
    if (frais > 0) etudiant.dernierFraisInscription = frais;
    await etudiant.save();

    // ✅ 3. CRÉER AUTOMATIQUEMENT LE PAIEMENT
    let paiementCree = null;
    if (frais > 0) {
      try {
        const numeroRecu = await genererNumeroRecu();

        paiementCree = await Paiement.create({
          etudiant: etudiantId,
          typePaiement: "Inscription",
          montant: Math.round(frais),
          modePaiement: "Espèces",
          classe: classe.trim(),
          niveau: niveau?.trim() || "",
          option: option?.trim() || "",
          anneeScolaire: anneeScolaire.trim(),
          datePaiement: dateInscr,
          commentaire: "Frais d'inscription (Carte d'étudiant + T-shirt)",
          numeroRecu,
          inscription: inscription._id,
          enregistrePar: req.user?._id || null,
        });

        console.log(`✅ Paiement inscription créé : ${numeroRecu} — ${frais} GNF`);
      } catch (errPaiement) {
        console.error("❌ Erreur création paiement:", errPaiement.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `${etudiant.nomComplet || etudiant.prenom + ' ' + etudiant.nom} a été inscrit(e) avec succès pour ${anneeScolaire}`
        + (paiementCree ? ` — Paiement de ${Math.round(frais)} GNF enregistré` : ""),
      inscription: {
        _id: inscription._id,
        etudiant: inscription.etudiant,
        classe: inscription.classe,
        niveau: inscription.niveau,
        option: inscription.option,
        anneeScolaire: inscription.anneeScolaire,
        fraisInscription: inscription.fraisInscription,
        dateInscription: inscription.dateInscription,
      },
      paiement: paiementCree ? {
        _id: paiementCree._id,
        numeroRecu: paiementCree.numeroRecu,
        montant: paiementCree.montant,
        typePaiement: paiementCree.typePaiement,
      } : null,
    });

  } catch (error) {
    console.error("❌ Erreur ajoutInscription:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: Object.keys(error.errors).map(k => error.errors[k].message),
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Doublon détecté",
        details: error.keyValue,
      });
    }
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// ==================================================
// ============ LISTER TOUTES LES INSCRIPTIONS ======
// ==================================================
module.exports.getAllInscriptions = async (req, res) => {
  try {
    const { anneeScolaire, etudiant, classe } = req.query;

    const filtre = {};
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;
    if (etudiant) filtre.etudiant = etudiant;
    if (classe) filtre.classe = classe;

    const inscriptions = await InscriptionModel
      .find(filtre)
      .populate('etudiant', 'nomComplet matricule photo contacts')
      .sort({ dateInscription: -1 });

    res.status(200).json({
      success: true,
      count: inscriptions.length,
      inscriptions,
    });
  } catch (error) {
    console.error("❌ Erreur getAllInscriptions:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// ============ VOIR UNE INSCRIPTION ================
// ==================================================
module.exports.getInscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }

    const inscription = await InscriptionModel
      .findById(id)
      .populate('etudiant', 'nomComplet matricule photo contacts');

    if (!inscription) {
      return res.status(404).json({ success: false, message: "Inscription non trouvée" });
    }

    const paiements = await Paiement.find({ inscription: id });

    res.status(200).json({
      success: true,
      inscription,
      paiements,
    });
  } catch (error) {
    console.error("❌ Erreur getInscription:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// ============ MODIFIER UNE INSCRIPTION ============
// ✅ Comptable autorisé (cohérent avec allRoute.js)
// ==================================================
module.exports.modifierInscription = async (req, res) => {
  try {
    if (!req.user || !['admin', 'superAdmin', 'Comptable'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé.",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }

    const inscription = await InscriptionModel.findById(id);
    if (!inscription) {
      return res.status(404).json({ success: false, message: "Inscription non trouvée" });
    }

    const { classe, niveau, option, anneeScolaire, fraisInscription, dateInscription, statut } = req.body;

    if (classe !== undefined) inscription.classe = classe.trim();
    if (niveau !== undefined) inscription.niveau = niveau?.trim() || null;
    if (option !== undefined) inscription.option = option?.trim() || null;
    if (anneeScolaire !== undefined) inscription.anneeScolaire = anneeScolaire.trim();
    if (fraisInscription !== undefined) inscription.fraisInscription = Number(fraisInscription) || 0;
    if (dateInscription !== undefined) inscription.dateInscription = new Date(dateInscription);
    if (statut !== undefined) inscription.statut = statut;

    await inscription.save();

    res.status(200).json({
      success: true,
      message: "Inscription modifiée avec succès",
      inscription,
    });
  } catch (error) {
    console.error("❌ Erreur modifierInscription:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// ============ SUPPRIMER UNE INSCRIPTION ===========
// ==================================================
module.exports.supprimerInscription = async (req, res) => {
  try {
    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé.",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }

    const inscription = await InscriptionModel.findById(id);
    if (!inscription) {
      return res.status(404).json({ success: false, message: "Inscription non trouvée" });
    }

    const resultPaiements = await Paiement.deleteMany({ inscription: id });
    await InscriptionModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Inscription supprimée avec succès",
      paiementsSupprimes: resultPaiements.deletedCount,
    });
  } catch (error) {
    console.error("❌ Erreur supprimerInscription:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// ===== INSCRIPTIONS D'UN ÉTUDIANT =================
// ==================================================
module.exports.getInscriptionsByEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(etudiantId)) {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }

    const inscriptions = await InscriptionModel
      .find({ etudiant: etudiantId })
      .sort({ anneeScolaire: -1 });

    const enrichies = await Promise.all(
      inscriptions.map(async (i) => {
        const paiements = await Paiement.find({ inscription: i._id });
        const totalPaye = paiements.reduce((s, p) => s + (p.montant || 0), 0);
        return {
          ...i.toObject(),
          totalPaye,
          nombrePaiements: paiements.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichies.length,
      inscriptions: enrichies,
    });
  } catch (error) {
    console.error("❌ Erreur getInscriptionsByEtudiant:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// ============ 🆕 STATS INSCRIPTIONS ===============
// (appelée par allRoute.js : getStatsInscriptions)
// ==================================================
module.exports.getStatsInscriptions = async (req, res) => {
  try {
    const { anneeScolaire } = req.query;
    const filtre = { statut: 'validee' };
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;

    const inscriptions = await InscriptionModel.find(filtre);

    const totalInscriptions = inscriptions.length;
    const totalFrais = Math.round(
      inscriptions.reduce((s, i) => s + (i.fraisInscription || 0), 0)
    );

    // Regroupement par année scolaire
    const parAnnee = {};
    inscriptions.forEach((i) => {
      const key = i.anneeScolaire || "Inconnue";
      if (!parAnnee[key]) parAnnee[key] = { count: 0, frais: 0 };
      parAnnee[key].count += 1;
      parAnnee[key].frais += i.fraisInscription || 0;
    });

    // Regroupement par classe
    const parClasse = {};
    inscriptions.forEach((i) => {
      const key = i.classe || "Inconnue";
      if (!parClasse[key]) parClasse[key] = { count: 0, frais: 0 };
      parClasse[key].count += 1;
      parClasse[key].frais += i.fraisInscription || 0;
    });

    res.status(200).json({
      success: true,
      totalInscriptions,
      totalFrais,
      parAnnee,
      parClasse,
    });
  } catch (error) {
    console.error("❌ Erreur getStatsInscriptions:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// === ÉTUDIANTS RÉINSCRIPTIBLES POUR UNE ANNÉE ====
// ==================================================
module.exports.getEtudiantsReinscriptibles = async (req, res) => {
  const { anneeScolaire } = req.query;

  if (!anneeScolaire) {
    return res.status(400).json({
      success: false,
      message: "Le paramètre anneeScolaire est requis (ex: 2027-2028)",
    });
  }

  try {
    const inscriptionsAnnee = await InscriptionModel
      .find({ anneeScolaire, statut: 'validee' })
      .select('etudiant');

    const idsInscritsCetteAnnee = inscriptionsAnnee.map(i => i.etudiant.toString());

    const etudiants = await EtudiantModel
      .find({ inscrit: true, actif: true })
      .select('-motDePasse')
      .sort({ nom: 1 });

    const reinscriptibles = etudiants.filter(
      e => !idsInscritsCetteAnnee.includes(e._id.toString())
    );

    res.status(200).json({
      success: true,
      anneeScolaire,
      count: reinscriptibles.length,
      etudiants: reinscriptibles,
    });
  } catch (error) {
    console.error("❌ Erreur getEtudiantsReinscriptibles:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// === ÉTUDIANTS NON INSCRITS POUR UNE ANNÉE =======
// ==================================================
module.exports.getEtudiantsNonInscrits = async (req, res) => {
  const { anneeScolaire } = req.query;

  if (!anneeScolaire) {
    return res.status(400).json({
      success: false,
      message: "Le paramètre anneeScolaire est requis",
    });
  }

  try {
    const inscriptionsAnnee = await InscriptionModel
      .find({ anneeScolaire, statut: 'validee' })
      .select('etudiant');

    const idsInscritsCetteAnnee = inscriptionsAnnee.map(i => i.etudiant.toString());

    const etudiants = await EtudiantModel
      .find({ actif: true })
      .select('-motDePasse')
      .sort({ nom: 1 });

    const nonInscrits = etudiants.filter(
      e => !idsInscritsCetteAnnee.includes(e._id.toString())
    );

    res.status(200).json({
      success: true,
      anneeScolaire,
      count: nonInscrits.length,
      etudiants: nonInscrits,
    });
  } catch (error) {
    console.error("❌ Erreur getEtudiantsNonInscrits:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ==================================================
// ============ 🔑 ALIAS DE COMPATIBILITÉ ==========
// Pour que allRoute.js fonctionne SANS être modifié
// ==================================================
module.exports.inscrireEtudiant = module.exports.ajoutInscription;
module.exports.getInscriptionsEtudiant = module.exports.getInscriptionsByEtudiant;
module.exports.getUneInscription = module.exports.getInscription;

// ==================================================
// ✅ LOG DE CHARGEMENT (pour debug)
// ==================================================
console.log("✅ [inscriptionController] Exports disponibles :", Object.keys(module.exports));