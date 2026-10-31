// ==================== controllers/paiementController.js ====================
const Paiement = require("../models/Paiement");
const BaremeFrais = require("../models/BaremeFrais");
const Etudiant = require("../models/EtudiantModel");
const Inscription = require("../models/InscriptionModel"); // 🆕 AJOUT

// ==================== UTILITAIRE : Générer Numéro Reçu ====================
const genererNumeroRecu = async () => {
  const year = new Date().getFullYear();
  const count = await Paiement.countDocuments();
  const num = String(count + 1).padStart(5, "0");
  return `REC-${year}-${num}`;
};

// ✅ AJOUT : Normaliser une classe (casse, accents, espaces)
const normaliserClasse = (c) => {
  if (!c) return "";
  return c.toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// ✅ AJOUT : Trouver le barème en cascade
// 1. Match exact (classe + année) → 2. Classe seule → 3. Classe normalisée → 4. Match partiel
const trouverBareme = async (classe, anneeScolaire) => {
  if (!classe) return null;

  const classeNorm = normaliserClasse(classe);

  // 1. Match exact
  if (anneeScolaire) {
    let b = await BaremeFrais.findOne({ classe, anneeScolaire });
    if (b) return b;
  }

  // 2. Match par classe seule
  let b = await BaremeFrais.findOne({ classe }).sort({ createdAt: -1 });
  if (b) return b;

  // 3. Match par classe normalisée
  const tousBaremes = await BaremeFrais.find({});
  const trouve = tousBaremes.find(
    (x) => normaliserClasse(x.classe) === classeNorm
  );
  if (trouve) return trouve;

  // 4. Match partiel
  const trouvePartiel = tousBaremes.find((x) => {
    const bc = normaliserClasse(x.classe);
    return bc && (bc.includes(classeNorm) || classeNorm.includes(bc));
  });
  if (trouvePartiel) return trouvePartiel;

  return null;
};

// 🆕 AJOUT : Calcul progression (force 100% si reste <= 0)
const calculerProgression = (totalDu, totalPaye, reste) => {
  const du = Number(totalDu) || 0;
  const paye = Number(totalPaye) || 0;
  const r = Number(reste) || 0;
  if (du <= 0) return paye > 0 ? 100 : 0;
  if (r <= 0 || paye >= du) return 100; // ✅ force 100
  return Math.min(100, Math.round((paye / du) * 100));
};

// 🆕 AJOUT : Calcul statut (cohérent)
const calculerStatut = (totalDu, totalPaye, reste) => {
  const du = Number(totalDu) || 0;
  const paye = Number(totalPaye) || 0;
  if (du === 0 && paye === 0) return "Inconnu";
  if (reste <= 0) return "Payé";
  if (paye === 0) return "Impayé";
  return "Partiel";
};

// ==================================================
// ============ BARÈME DE FRAIS =====================
// ==================================================

// --- Créer ou mettre à jour un barème ---
exports.creerOuModifierBareme = async (req, res) => {
  try {
    const { classe, anneeScolaire, fraisInscription, fraisScolarite, fraisTenue, description } = req.body;

    if (!classe || !anneeScolaire) {
      return res.status(400).json({ message: "Classe et année scolaire obligatoires" });
    }

    const bareme = await BaremeFrais.findOneAndUpdate(
      { classe, anneeScolaire },
      {
        classe,
        anneeScolaire,
        fraisInscription: Number(fraisInscription) || 0,
        fraisScolarite: Number(fraisScolarite) || 0,
        fraisTenue: Number(fraisTenue) || 0,
        description: description || "",
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Barème enregistré avec succès",
      bareme,
    });
  } catch (error) {
    console.error("❌ [BARÈME] Erreur:", error);
    return res.status(500).json({ message: "Erreur barème", error: error.message });
  }
};

// --- Lister tous les barèmes ---
exports.getTousBaremes = async (req, res) => {
  try {
    const { anneeScolaire } = req.query;
    const filtre = {};
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;

    const baremes = await BaremeFrais.find(filtre).sort({ classe: 1 });

    return res.status(200).json({
      message: "Barèmes récupérés",
      baremes,
      total: baremes.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- Supprimer un barème ---
exports.supprimerBareme = async (req, res) => {
  try {
    await BaremeFrais.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Barème supprimé" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// ==================================================
// ============== PAIEMENTS =========================
// ==================================================

// --- Ajouter un paiement ---
exports.ajouterPaiement = async (req, res) => {
  try {
    console.log("📥 [AJOUT PAIEMENT] Body:", req.body);

    const {
      etudiant,
      typePaiement,
      montant,
      modePaiement,
      classe,
      niveau,
      option,
      anneeScolaire,
      trimestre,
      datePaiement,
      commentaire,
    } = req.body;

    // ✅ Validations de base
    if (!etudiant) return res.status(400).json({ message: "L'étudiant est obligatoire" });
    if (!typePaiement) return res.status(400).json({ message: "Le type de paiement est obligatoire" });
    if (!montant || Number(montant) <= 0) return res.status(400).json({ message: "Montant invalide" });
    if (!classe) return res.status(400).json({ message: "La classe est obligatoire" });
    if (!anneeScolaire) return res.status(400).json({ message: "L'année scolaire est obligatoire" });

    // ✅ AJOUT : Validation commentaire obligatoire pour "Autre paiement"
    if (
      modePaiement === "Autre paiement" &&
      (!commentaire || commentaire.trim().length < 3)
    ) {
      return res.status(400).json({
        message: "Le commentaire est obligatoire (min. 3 caractères) pour le mode 'Autre paiement'",
      });
    }

    // ✅ Vérifier étudiant
    const etudiantExiste = await Etudiant.findById(etudiant);
    if (!etudiantExiste) return res.status(404).json({ message: "Étudiant introuvable" });

    // 🆕 AJOUT : Vérifier que l'étudiant est bien inscrit pour cette année
    const inscription = await Inscription.findOne({ etudiant, anneeScolaire });
    if (!inscription) {
      return res.status(400).json({
        message: `Cet étudiant n'est pas inscrit pour l'année ${anneeScolaire}. Inscrivez-le d'abord.`,
      });
    }

    // ✅ Numéro de reçu unique
    const numeroRecu = await genererNumeroRecu();

    // ✅ Créer le paiement
    const nouveauPaiement = new Paiement({
      etudiant,
      typePaiement,
      montant: Math.round(Number(montant)), // 🆕 arrondi
      modePaiement: modePaiement || "Espèces",
      classe: classe.trim(),
      niveau: (niveau || inscription.niveau || "").trim(), // 🆕 fallback inscription
      option: (option || inscription.option || "").trim(), // 🆕 fallback inscription
      anneeScolaire: anneeScolaire.trim(),
      trimestre: trimestre ? Number(trimestre) : null,
      datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
      numeroRecu,
      commentaire: commentaire || "",
      enregistrePar: req.user?._id || null,
      inscription: inscription._id, // 🆕 lien inscription
    });

    await nouveauPaiement.save();

    const paiementPeuple = await Paiement.findById(nouveauPaiement._id)
      .populate("etudiant", "nomComplet matricule classe photo");

    console.log("✅ Paiement ajouté:", numeroRecu, "—", anneeScolaire);

    return res.status(201).json({
      message: `Paiement enregistré pour ${anneeScolaire}`,
      paiement: paiementPeuple,
    });
  } catch (error) {
    console.error("❌ [AJOUT PAIEMENT] Erreur:", error);
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- Lister tous les paiements ---
exports.getTousPaiements = async (req, res) => {
  try {
    const { etudiant, classe, anneeScolaire, typePaiement, modePaiement } = req.query;

    const filtre = {};
    if (etudiant) filtre.etudiant = etudiant;
    if (classe) filtre.classe = classe;
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;
    if (typePaiement) filtre.typePaiement = typePaiement;
    if (modePaiement) filtre.modePaiement = modePaiement;

    const paiements = await Paiement.find(filtre)
      .populate("etudiant", "nomComplet matricule classe photo niveau option")
      .sort({ datePaiement: -1 });

    return res.status(200).json({
      message: "Paiements récupérés",
      paiements,
      total: paiements.length,
    });
  } catch (error) {
    console.error("❌ [GET PAIEMENTS] Erreur:", error);
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- Voir un paiement ---
exports.getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate("etudiant", "nomComplet matricule classe photo");

    if (!paiement) return res.status(404).json({ message: "Paiement introuvable" });

    return res.status(200).json({ message: "OK", paiement });
  } catch (error) {
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- Modifier un paiement ---
exports.modifierPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id);
    if (!paiement) return res.status(404).json({ message: "Paiement introuvable" });

    const { typePaiement, montant, modePaiement, commentaire, datePaiement } = req.body;

    if (typePaiement !== undefined) paiement.typePaiement = typePaiement;
    if (montant !== undefined) paiement.montant = Math.round(Number(montant)); // 🆕 arrondi
    if (modePaiement !== undefined) paiement.modePaiement = modePaiement;
    if (commentaire !== undefined) paiement.commentaire = commentaire;
    if (datePaiement !== undefined) paiement.datePaiement = new Date(datePaiement);

    // ✅ AJOUT : Revalidation du commentaire si on passe à "Autre paiement"
    if (
      paiement.modePaiement === "Autre paiement" &&
      (!paiement.commentaire || paiement.commentaire.trim().length < 3)
    ) {
      return res.status(400).json({
        message: "Le commentaire est obligatoire (min. 3 caractères) pour le mode 'Autre paiement'",
      });
    }

    await paiement.save();

    return res.status(200).json({ message: "Paiement modifié", paiement });
  } catch (error) {
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// --- Supprimer un paiement ---
exports.supprimerPaiement = async (req, res) => {
  try {
    await Paiement.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Paiement supprimé" });
  } catch (error) {
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// ==================================================
// ====== FICHE ÉLÈVE — RÉSUMÉ FINANCIER ============
// ==================================================
exports.getFicheEleve = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { anneeScolaire } = req.query;

    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) return res.status(404).json({ message: "Étudiant introuvable" });

    // 🆕 AJOUT : Récupérer l'inscription pour cette année (classe du moment)
    let inscription = null;
    if (anneeScolaire) {
      inscription = await Inscription.findOne({ etudiant: etudiantId, anneeScolaire });
    }

    // Classe : priorité à l'inscription de l'année, sinon fallback
    const classe = inscription?.classe || etudiant.derniereClasse || etudiant.classe || "";
    const annee = anneeScolaire || inscription?.anneeScolaire || etudiant.anneeInscriptionActuelle || "";

    const bareme = await trouverBareme(classe, annee);

    const totalDuBareme = bareme
      ? (bareme.fraisInscription || 0) + (bareme.fraisScolarite || 0) + (bareme.fraisTenue || 0)
      : 0;

    // Paiements de l'élève — 🆕 filtre année strict
    const filtre = { etudiant: etudiantId };
    if (annee) filtre.anneeScolaire = annee;
    const paiements = await Paiement.find(filtre).sort({ datePaiement: -1 });

    const totalPaye = Math.round(paiements.reduce((s, p) => s + p.montant, 0));

    let totalDu = Math.round(totalDuBareme);
    let sourceTotalDu = "bareme";

    if (totalDu === 0 && totalPaye > 0) {
      const scolaritePayee = paiements
        .filter((p) => p.typePaiement === "Scolarité")
        .reduce((s, p) => s + p.montant, 0);

      if (scolaritePayee > 0) {
        totalDu = Math.round(scolaritePayee * 3);
        sourceTotalDu = "estimation";
      } else {
        totalDu = totalPaye;
        sourceTotalDu = "paiements";
      }
    }

    const resteAPayer = Math.max(0, Math.round(totalDu - totalPaye));

    // Détail par type
    const parType = {
      Inscription: 0,
      Scolarité: 0,
      Tenue: 0,
      Autre: 0,
    };
    paiements.forEach((p) => {
      if (parType[p.typePaiement] !== undefined) parType[p.typePaiement] += p.montant;
    });

    return res.status(200).json({
      message: "Fiche élève récupérée",
      fiche: {
        etudiant: {
          _id: etudiant._id,
          nomComplet: etudiant.nomComplet,
          matricule: etudiant.matricule,
          classe,                                                          // 🆕 classe de l'année
          niveau: inscription?.niveau || etudiant.dernierNiveau || etudiant.niveau || "",  // 🆕
          option: inscription?.option || etudiant.derniereOption || etudiant.option || "", // 🆕
          photo: etudiant.photo,
          anneeScolaire: annee,
        },
        bareme,
        totalDu,
        totalPaye,
        resteAPayer,
        // 🆕 MODIFIÉ : progression corrigée (force 100% si reste 0)
        progression: calculerProgression(totalDu, totalPaye, resteAPayer),
        // 🆕 MODIFIÉ : statut corrigé
        statut: calculerStatut(totalDu, totalPaye, resteAPayer),
        sourceTotalDu,
        parType,
        paiements,
        inscription, // 🆕 renvoie l'inscription de l'année (classe, niveau, option)
      },
    });
  } catch (error) {
    console.error("❌ [FICHE ÉLÈVE] Erreur:", error);
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// ==================================================
// ====== STATS GLOBALES COMPTABILITÉ ===============
// ==================================================
exports.getStatsComptabilite = async (req, res) => {
  try {
    const { anneeScolaire, classe } = req.query;

    const filtre = {};
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;
    if (classe) filtre.classe = classe;

    const paiements = await Paiement.find(filtre);

    const totalPerçu = Math.round(paiements.reduce((s, p) => s + p.montant, 0)); // 🆕 arrondi
    const nombrePaiements = paiements.length;
    const elevesUniques = new Set(paiements.map((p) => p.etudiant.toString())).size;

    // Par type
    const parType = { Inscription: 0, Scolarité: 0, Tenue: 0, Autre: 0 };
    paiements.forEach((p) => {
      if (parType[p.typePaiement] !== undefined) parType[p.typePaiement] += p.montant;
    });

    // ✅ MODIFIÉ : Par mode (ajout des nouveaux modes)
    const parMode = {
      Espèces: 0,
      "Mobile Money": 0,
      Virement: 0,
      Chèque: 0,
      "Orange Money": 0,
      "Autre paiement": 0,
    };
    paiements.forEach((p) => {
      if (parMode[p.modePaiement] !== undefined) parMode[p.modePaiement] += p.montant;
    });

    // Par mois (12 derniers mois)
    const parMois = {};
    paiements.forEach((p) => {
      const key = `${p.datePaiement.getFullYear()}-${String(p.datePaiement.getMonth() + 1).padStart(2, "0")}`;
      if (!parMois[key]) parMois[key] = 0;
      parMois[key] += p.montant;
    });

    return res.status(200).json({
      message: "Stats comptabilité",
      totalPerçu,
      nombrePaiements,
      elevesUniques,
      parType,
      parMode,
      parMois,
    });
  } catch (error) {
    console.error("❌ [STATS COMPTA] Erreur:", error);
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// ==================================================
// ====== LISTE ÉLÈVES + STATUT PAIEMENT ============
// ==================================================
// 🆕 AJOUT MAJEUR : filtre strict par année via Inscription
exports.getElevesAvecStatut = async (req, res) => {
  try {
    const { anneeScolaire, classe } = req.query;

    // 🆕 Si anneeScolaire est fourni → on part des inscriptions de cette année
    // Sinon on garde l'ancien comportement (fallback)
    let etudiantsAvecClasse = [];

    if (anneeScolaire) {
      // Filtrer les inscriptions de cette année
      const filtreInscription = { anneeScolaire, statut: "validee" };
      if (classe) filtreInscription.classe = classe;

      const inscriptions = await Inscription.find(filtreInscription).populate("etudiant");

      etudiantsAvecClasse = inscriptions
        .filter((i) => i.etudiant) // sécurité
        .map((i) => ({
          etudiant: i.etudiant,
          classe: i.classe,
          niveau: i.niveau || "",
          option: i.option || "",
          anneeScolaire,
          inscription: i,
        }));
    } else {
      // Fallback : ancien comportement (derniereClasse)
      const etudiants = await Etudiant.find({}).sort({ nomComplet: 1 });
      etudiantsAvecClasse = etudiants.map((e) => ({
        etudiant: e,
        classe: e.derniereClasse || e.classe || "",
        niveau: e.dernierNiveau || e.niveau || "",
        option: e.derniereOption || e.option || "",
        anneeScolaire: e.anneeInscriptionActuelle || "",
        inscription: null,
      }));
    }

    const resultat = await Promise.all(
      etudiantsAvecClasse.map(async ({ etudiant: e, classe: cl, niveau, option, anneeScolaire: annee, inscription }) => {
        // ✅ Recherche barème en cascade
        const bareme = await trouverBareme(cl, annee);

        const totalDuBareme = bareme
          ? (bareme.fraisInscription || 0) + (bareme.fraisScolarite || 0) + (bareme.fraisTenue || 0)
          : 0;

        // 🆕 Paiements strictement pour cette année
        const filtre = { etudiant: e._id };
        if (annee) filtre.anneeScolaire = annee;
        const paiements = await Paiement.find(filtre);

        const totalPaye = Math.round(paiements.reduce((s, p) => s + p.montant, 0));

        // ✅ Fallback si pas de barème mais des paiements
        let totalDu = Math.round(totalDuBareme);
        if (totalDu === 0 && totalPaye > 0) {
          const scolaritePayee = paiements
            .filter((p) => p.typePaiement === "Scolarité")
            .reduce((s, p) => s + p.montant, 0);

          totalDu = scolaritePayee > 0 ? Math.round(scolaritePayee * 3) : totalPaye;
        }

        const reste = Math.max(0, Math.round(totalDu - totalPaye));

        return {
          _id: e._id,
          nomComplet: e.nomComplet,
          matricule: e.matricule,
          classe: cl,          // 🆕 classe de l'inscription (pas derniereClasse)
          niveau,              // 🆕
          option,              // 🆕
          photo: e.photo,
          anneeScolaire: annee,
          totalDu,
          totalPaye,
          resteAPayer: reste,
          // 🆕 MODIFIÉ : progression corrigée (100% si reste <= 0)
          progression: calculerProgression(totalDu, totalPaye, reste),
          // 🆕 MODIFIÉ : statut corrigé
          statut: calculerStatut(totalDu, totalPaye, reste),
          inscriptionId: inscription?._id || null,  // 🆕 utile pour la fiche
        };
      })
    );

    return res.status(200).json({
      message: "Liste élèves avec statut",
      anneeScolaire: anneeScolaire || "all",
      eleves: resultat,
      total: resultat.length,
    });
  } catch (error) {
    console.error("❌ [ÉLÈVES STATUT] Erreur:", error);
    return res.status(500).json({ message: "Erreur", error: error.message });
  }
};