// ==================== controllers/noteController.js ====================
const Note = require("../models/Note");
const Etudiant = require("../models/EtudiantModel");
// ==================== UTILITAIRE : APPRÉCIATION AUTO ====================
const getAppreciation = (moyenne) => {
  if (moyenne >= 18) return { texte: "Excellent", mention: "Félicitations" };
  if (moyenne >= 16) return { texte: "Très Bien", mention: "Félicitations" };
  if (moyenne >= 14) return { texte: "Bien", mention: "Encouragements" };
  if (moyenne >= 12) return { texte: "Assez Bien", mention: "" };
  if (moyenne >= 10) return { texte: "Passable", mention: "" };
  if (moyenne >= 8)  return { texte: "Insuffisant", mention: "Avertissement" };
  return { texte: "Très Faible", mention: "Blâme" };
};

// ==================== UTILITAIRE : MOYENNE PONDÉRÉE ====================
const calculerMoyenne = (notes) => {
  if (!notes || notes.length === 0) return 0;
  let total = 0;
  let totalCoef = 0;
  notes.forEach((n) => {
    total += n.note * n.coefficient;
    totalCoef += n.coefficient;
  });
  return totalCoef === 0 ? 0 : total / totalCoef;
};

// ==================================================
// ============== AJOUTER UNE NOTE ==================
// ==================================================
exports.ajouterNote = async (req, res) => {
  try {
    console.log("📥 [AJOUT NOTE] Body:", req.body);

    const {
      etudiant,
      matiere,
      classe,
      niveau,
      option,
      anneeScolaire,
      note,
      coefficient,
      type,
      trimestre,
      dateEvaluation,
      enseignant,
      commentaire,
    } = req.body;

    // ✅ Validation
    if (!etudiant) {
      return res.status(400).json({ message: "Veuillez sélectionner un étudiant" });
    }
    if (!matiere || !matiere.trim()) {
      return res.status(400).json({ message: "La matière est obligatoire" });
    }
    if (!classe || !classe.trim()) {
      return res.status(400).json({ message: "La classe est obligatoire" });
    }
    if (!anneeScolaire || !anneeScolaire.trim()) {
      return res.status(400).json({ message: "L'année scolaire est obligatoire" });
    }
    if (note === undefined || note === null || note === "") {
      return res.status(400).json({ message: "La note est obligatoire" });
    }

    const noteNum = Number(note);
    if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      return res.status(400).json({ message: "La note doit être entre 0 et 20" });
    }

    // ✅ Vérifier étudiant
    const etudiantExiste = await Etudiant.findById(etudiant);
    if (!etudiantExiste) {
      return res.status(404).json({ message: "Étudiant introuvable" });
    }

    // ✅ Créer la note
    const nouvelleNote = new Note({
      etudiant,
      matiere: matiere.trim(),
      classe: classe.trim(),
      niveau: (niveau || "").trim(),
      option: (option || "").trim(),
      anneeScolaire: anneeScolaire.trim(),
      note: noteNum,
      coefficient: Number(coefficient) || 1,
      type: type || "Devoir",
      trimestre: Number(trimestre) || 1,
      dateEvaluation: dateEvaluation ? new Date(dateEvaluation) : new Date(),
      enseignant: enseignant || null,
      commentaire: commentaire || "",
    });

    await nouvelleNote.save();

    const notePeuplee = await Note.findById(nouvelleNote._id)
      .populate("etudiant", "nomComplet matricule classe photo niveau option")
      .populate("enseignant", "nomComplet matricule");

    console.log("✅ Note ajoutée pour:", etudiantExiste.nomComplet);

    return res.status(201).json({
      message: "Note ajoutée avec succès",
      note: notePeuplee,
    });
  } catch (error) {
    console.error("❌ [AJOUT NOTE] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de l'ajout de la note",
      error: error.message,
    });
  }
};

// ==================================================
// ========== LISTER TOUTES LES NOTES ===============
// ==================================================
exports.getToutesLesNotes = async (req, res) => {
  try {
    const { classe, niveau, option, anneeScolaire, trimestre, matiere, etudiant } = req.query;

    // ✅ Construire le filtre dynamiquement
    const filtre = {};
    if (classe) filtre.classe = classe;
    if (niveau) filtre.niveau = niveau;
    if (option) filtre.option = option;
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;
    if (trimestre) filtre.trimestre = Number(trimestre);
    if (matiere) filtre.matiere = matiere;
    if (etudiant) filtre.etudiant = etudiant;

    const notes = await Note.find(filtre)
      .populate("etudiant", "nomComplet matricule classe photo genre niveau option")
      .populate("enseignant", "nomComplet matricule")
      .sort({ dateEvaluation: -1 });

    console.log(`📤 ${notes.length} note(s) envoyée(s)`);

    return res.status(200).json({
      message: "Liste des notes récupérée avec succès",
      notes,
      total: notes.length,
    });
  } catch (error) {
    console.error("❌ [GET NOTES] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des notes",
      error: error.message,
    });
  }
};

// ==================================================
// ====== VOIR UNE NOTE PAR ID ======================
// ==================================================
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("etudiant", "nomComplet matricule classe photo niveau option")
      .populate("enseignant", "nomComplet matricule");

    if (!note) {
      return res.status(404).json({ message: "Note introuvable" });
    }

    return res.status(200).json({
      message: "Note récupérée avec succès",
      note,
    });
  } catch (error) {
    console.error("❌ [GET NOTE BY ID] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération de la note",
      error: error.message,
    });
  }
};

// ==================================================
// ====== MODIFIER UNE NOTE =========================
// ==================================================
exports.modifierNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note introuvable" });
    }

    const {
      matiere,
      classe,
      niveau,
      option,
      anneeScolaire,
      note: noteValue,
      coefficient,
      type,
      trimestre,
      dateEvaluation,
      commentaire,
    } = req.body;

    // ✅ Mise à jour sélective
    if (matiere !== undefined) note.matiere = matiere.trim();
    if (classe !== undefined) note.classe = classe.trim();
    if (niveau !== undefined) note.niveau = niveau;
    if (option !== undefined) note.option = option;
    if (anneeScolaire !== undefined) note.anneeScolaire = anneeScolaire.trim();
    if (noteValue !== undefined) {
      if (noteValue < 0 || noteValue > 20) {
        return res.status(400).json({ message: "La note doit être entre 0 et 20" });
      }
      note.note = Number(noteValue);
    }
    if (coefficient !== undefined) note.coefficient = Number(coefficient);
    if (type !== undefined) note.type = type;
    if (trimestre !== undefined) note.trimestre = Number(trimestre);
    if (dateEvaluation !== undefined) note.dateEvaluation = new Date(dateEvaluation);
    if (commentaire !== undefined) note.commentaire = commentaire;

    await note.save();

    const notePeuplee = await Note.findById(note._id)
      .populate("etudiant", "nomComplet matricule classe niveau option")
      .populate("enseignant", "nomComplet matricule");

    return res.status(200).json({
      message: "Note modifiée avec succès",
      note: notePeuplee,
    });
  } catch (error) {
    console.error("❌ [MODIF NOTE] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la modification de la note",
      error: error.message,
    });
  }
};

// ==================================================
// ====== SUPPRIMER UNE NOTE ========================
// ==================================================
exports.supprimerNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note introuvable" });
    }

    await Note.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Note supprimée avec succès" });
  } catch (error) {
    console.error("❌ [DELETE NOTE] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la suppression de la note",
      error: error.message,
    });
  }
};

// ==================================================
// ====== MOYENNES D'UN ÉTUDIANT ====================
// ==================================================
exports.getMoyennesEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { trimestre, anneeScolaire } = req.query;

    const filtre = { etudiant: etudiantId };
    if (trimestre) filtre.trimestre = Number(trimestre);
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;

    const notes = await Note.find(filtre).sort({ matiere: 1 });

    if (notes.length === 0) {
      return res.status(200).json({
        message: "Aucune note trouvée",
        moyennes: {},
        moyenneGenerale: 0,
      });
    }

    // 🎯 Grouper les notes par matière
    const parMatiere = {};
    notes.forEach((n) => {
      if (!parMatiere[n.matiere]) parMatiere[n.matiere] = [];
      parMatiere[n.matiere].push(n);
    });

    // 🎯 Calculer la moyenne par matière
    const moyennes = {};
    let sommeGenerale = 0;
    let coefGeneral = 0;

    Object.keys(parMatiere).forEach((matiere) => {
      const notesMatiere = parMatiere[matiere];
      const moyenne = calculerMoyenne(notesMatiere);
      const coefTotal = notesMatiere.reduce((s, n) => s + n.coefficient, 0);

      moyennes[matiere] = {
        moyenne: Number(moyenne.toFixed(2)),
        nombreNotes: notesMatiere.length,
        coefficientTotal: coefTotal,
        appreciation: getAppreciation(moyenne),
        details: notesMatiere.map((n) => ({
          _id: n._id,
          note: n.note,
          coefficient: n.coefficient,
          type: n.type,
          date: n.dateEvaluation,
        })),
      };

      sommeGenerale += moyenne * coefTotal;
      coefGeneral += coefTotal;
    });

    const moyenneGenerale = coefGeneral === 0 ? 0 : sommeGenerale / coefGeneral;

    return res.status(200).json({
      message: "Moyennes calculées avec succès",
      moyennes,
      moyenneGenerale: Number(moyenneGenerale.toFixed(2)),
      appreciationGenerale: getAppreciation(moyenneGenerale),
      totalNotes: notes.length,
    });
  } catch (error) {
    console.error("❌ [MOYENNES ETUDIANT] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors du calcul des moyennes",
      error: error.message,
    });
  }
};

// ==================================================
// ====== BULLETIN COMPLET D'UN ÉTUDIANT ============
// ==================================================
exports.getBulletinEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { trimestre, anneeScolaire } = req.query;

    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant introuvable" });
    }

    const filtre = { etudiant: etudiantId };
    if (trimestre) filtre.trimestre = Number(trimestre);
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;

    const notes = await Note.find(filtre);

    if (notes.length === 0) {
      return res.status(200).json({
        message: "Aucune note pour cet étudiant",
        bulletin: null,
      });
    }

    // 🎯 Grouper par matière
    const parMatiere = {};
    notes.forEach((n) => {
      if (!parMatiere[n.matiere]) parMatiere[n.matiere] = [];
      parMatiere[n.matiere].push(n);
    });

    // 🎯 Construire les lignes du bulletin
    const lignes = [];
    let sommeGen = 0;
    let coefGen = 0;

    Object.keys(parMatiere).forEach((matiere) => {
      const notesMatiere = parMatiere[matiere];
      const moyenne = calculerMoyenne(notesMatiere);
      const coefTotal = notesMatiere.reduce((s, n) => s + n.coefficient, 0);

      lignes.push({
        matiere,
        moyenne: Number(moyenne.toFixed(2)),
        coefficient: coefTotal,
        points: Number((moyenne * coefTotal).toFixed(2)),
        appreciation: getAppreciation(moyenne).texte,
      });

      sommeGen += moyenne * coefTotal;
      coefGen += coefTotal;
    });

    const moyenneGenerale = coefGen === 0 ? 0 : sommeGen / coefGen;

    // 🏆 Calcul du rang dans la classe
    const classe = notes[0]?.classe || etudiant.classe || "";
    const annee = anneeScolaire || notes[0]?.anneeScolaire || "";

    let rang = null;
    let totalEtudiants = null;

    if (classe && annee) {
      const notesClasse = await Note.find({
        classe,
        anneeScolaire: annee,
        ...(trimestre ? { trimestre: Number(trimestre) } : {}),
      }).populate("etudiant", "nomComplet matricule");

      // Grouper par étudiant
      const parEtudiant = {};
      notesClasse.forEach((n) => {
        const id = n.etudiant?._id?.toString();
        if (!id) return;
        if (!parEtudiant[id]) parEtudiant[id] = [];
        parEtudiant[id].push(n);
      });

      // Calculer moyenne de chaque étudiant
      const moyennesEtudiants = Object.entries(parEtudiant).map(([id, notesE]) => {
        const parMat = {};
        notesE.forEach((n) => {
          if (!parMat[n.matiere]) parMat[n.matiere] = [];
          parMat[n.matiere].push(n);
        });
        let somme = 0;
        let coef = 0;
        Object.values(parMat).forEach((notesM) => {
          const moy = calculerMoyenne(notesM);
          const c = notesM.reduce((s, n) => s + n.coefficient, 0);
          somme += moy * c;
          coef += c;
        });
        return { id, moyenne: coef === 0 ? 0 : somme / coef };
      });

      moyennesEtudiants.sort((a, b) => b.moyenne - a.moyenne);
      totalEtudiants = moyennesEtudiants.length;
      const index = moyennesEtudiants.findIndex((m) => m.id === etudiantId.toString());
      rang = index >= 0 ? index + 1 : null;
    }

    const bulletin = {
      etudiant: {
        _id: etudiant._id,
        nomComplet: etudiant.nomComplet,
        matricule: etudiant.matricule,
        classe,
        niveau: notes[0]?.niveau || etudiant.dernierNiveau || etudiant.niveau || "",
        option: notes[0]?.option || etudiant.derniereOption || etudiant.option || "",
        photo: etudiant.photo,
      },
      periode: {
        trimestre: trimestre ? Number(trimestre) : "Année",
        anneeScolaire: annee,
      },
      lignes,
      totaux: {
        totalPoints: Number(sommeGen.toFixed(2)),
        totalCoefficients: coefGen,
        moyenneGenerale: Number(moyenneGenerale.toFixed(2)),
      },
      appreciation: getAppreciation(moyenneGenerale),
      rang,
      totalEtudiants,
      nombreMatieres: lignes.length,
      nombreNotes: notes.length,
      dateGeneration: new Date(),
    };

    return res.status(200).json({
      message: "Bulletin généré avec succès",
      bulletin,
    });
  } catch (error) {
    console.error("❌ [BULLETIN] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la génération du bulletin",
      error: error.message,
    });
  }
};

// ==================================================
// ====== CLASSEMENT DE LA CLASSE ===================
// ==================================================
exports.getClassementClasse = async (req, res) => {
  try {
    const { classe } = req.params;
    const { trimestre, anneeScolaire, niveau, option } = req.query;

    const filtre = { classe };
    if (trimestre) filtre.trimestre = Number(trimestre);
    if (anneeScolaire) filtre.anneeScolaire = anneeScolaire;
    if (niveau) filtre.niveau = niveau;
    if (option) filtre.option = option;

    const notes = await Note.find(filtre).populate(
      "etudiant",
      "nomComplet matricule photo niveau option"
    );

    if (notes.length === 0) {
      return res.status(200).json({
        message: "Aucune note trouvée pour cette classe",
        classement: [],
      });
    }

    // 🎯 Grouper par étudiant
    const parEtudiant = {};
    notes.forEach((n) => {
      const id = n.etudiant?._id?.toString();
      if (!id) return;
      if (!parEtudiant[id]) parEtudiant[id] = { etudiant: n.etudiant, notes: [] };
      parEtudiant[id].notes.push(n);
    });

    // 🎯 Calculer moyenne générale de chaque étudiant
    const classement = Object.values(parEtudiant).map((item) => {
      const parMatiere = {};
      item.notes.forEach((n) => {
        if (!parMatiere[n.matiere]) parMatiere[n.matiere] = [];
        parMatiere[n.matiere].push(n);
      });

      let somme = 0;
      let coef = 0;
      Object.values(parMatiere).forEach((notesM) => {
        const moy = calculerMoyenne(notesM);
        const c = notesM.reduce((s, n) => s + n.coefficient, 0);
        somme += moy * c;
        coef += c;
      });

      const moyenne = coef === 0 ? 0 : somme / coef;

      return {
        etudiant: {
          _id: item.etudiant._id,
          nomComplet: item.etudiant.nomComplet,
          matricule: item.etudiant.matricule,
          photo: item.etudiant.photo,
          niveau: item.etudiant.niveau || "",
          option: item.etudiant.option || "",
        },
        moyenneGenerale: Number(moyenne.toFixed(2)),
        nombreNotes: item.notes.length,
      };
    });

    // 🎯 Trier par moyenne décroissante
    classement.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);

    // 🏆 Ajouter le rang
    classement.forEach((item, i) => {
      item.rang = i + 1;
      item.appreciation = getAppreciation(item.moyenneGenerale);
    });

    return res.status(200).json({
      message: "Classement généré avec succès",
      classe,
      totalEtudiants: classement.length,
      classement,
    });
  } catch (error) {
    console.error("❌ [CLASSEMENT] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors du calcul du classement",
      error: error.message,
    });
  }
};

// ==================================================
// ====== STATISTIQUES GÉNÉRALES ====================
// ==================================================
exports.getStatsNotes = async (req, res) => {
  try {
    const totalNotes = await Note.countDocuments();
    const classes = await Note.distinct("classe");
    const matieres = await Note.distinct("matiere");
    const niveaux = await Note.distinct("niveau");
    const options = await Note.distinct("option");

    const stats = await Note.aggregate([
      {
        $group: {
          _id: null,
          moyenneGenerale: { $avg: "$note" },
          noteMax: { $max: "$note" },
          noteMin: { $min: "$note" },
        },
      },
    ]);

    return res.status(200).json({
      message: "Statistiques des notes",
      totalNotes,
      nombreClasses: classes.length,
      nombreMatieres: matieres.length,
      nombreNiveaux: niveaux.length,
      nombreOptions: options.length,
      classes,
      matieres,
      niveaux: niveaux.filter((n) => n), // filtre les vides
      options: options.filter((o) => o),
      stats: stats[0] || { moyenneGenerale: 0, noteMax: 0, noteMin: 0 },
    });
  } catch (error) {
    console.error("❌ [STATS NOTES] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors des statistiques",
      error: error.message,
    });
  }
};

// 🎁 Export utilitaire
exports.calculerMoyenne = calculerMoyenne;
exports.getAppreciation = getAppreciation;