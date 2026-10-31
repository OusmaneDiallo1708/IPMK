// ==================== controllers/enseignantsController.js ====================
const Enseignant = require("../models/Enseignant");
const fs = require("fs");
const path = require("path");

// ==================== UTILITAIRES ====================

/**
 * Supprime un fichier du disque sans faire planter le serveur
 */
const deleteFile = (filePath) => {
  try {
    if (!filePath) return;
    const relative = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const fullPath = path.join(__dirname, "..", relative);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log("🗑️ Fichier supprimé:", relative);
    }
  } catch (err) {
    console.warn("⚠️ Impossible de supprimer le fichier:", err.message);
  }
};

/**
 * Génère un matricule automatique : ENS-2026-0001
 */
const generateMatricule = async () => {
  const year = new Date().getFullYear();
  const count = await Enseignant.countDocuments();
  const num = String(count + 1).padStart(4, "0");
  let matricule = `ENS-${year}-${num}`;

  let exists = await Enseignant.findOne({ matricule });
  let attempts = 0;
  while (exists && attempts < 100) {
    attempts++;
    const newNum = String(count + 1 + attempts).padStart(4, "0");
    matricule = `ENS-${year}-${newNum}`;
    exists = await Enseignant.findOne({ matricule });
  }
  return matricule;
};

/**
 * ✅ Parse les matières depuis :
 * - Un tableau direct : ["Maths", "Physique"]
 * - Une string JSON : '["Maths","Physique"]'
 * - Une string CSV : "Maths,Physique,Chimie"
 * - Un objet single : "Maths"
 *
 * Retourne toujours un tableau propre (trim, unique, sans vides, max 20)
 */
const parseMatieres = (raw) => {
  if (!raw) return [];

  let arr = [];

  // 1. Déjà un tableau
  if (Array.isArray(raw)) {
    arr = raw;
  }
  // 2. String → essayer JSON, sinon split par virgule
  else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Essaye JSON
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) arr = parsed;
      } catch {
        // JSON invalide → fallback CSV
        arr = trimmed.split(",");
      }
    } else {
      // CSV simple
      arr = trimmed.split(",");
    }
  }

  // 3. Nettoyage : trim + suppression doublons + suppression vides
  const cleaned = [
    ...new Set(
      arr
        .map((m) => String(m).trim())
        .filter((m) => m.length > 0)
    ),
  ];

  // 4. Limite à 20 matières
  return cleaned.slice(0, 20);
};

/**
 * ✅ Sync `matieres` ↔ `matiere` (compatibilité)
 * - Si matieres rempli et matiere vide → met matiere[0]
 * - Si matiere rempli et matieres vide → matieres = [matiere]
 */
const syncMatieres = (data) => {
  // Si matieres fourni mais pas matiere
  if (data.matieres && data.matieres.length > 0 && !data.matiere) {
    data.matiere = data.matieres[0];
  }
  // Si matiere fourni mais pas matieres
  if (data.matiere && (!data.matieres || data.matieres.length === 0)) {
    data.matieres = [data.matiere];
  }
  return data;
};

// ==================== AJOUTER UN ENSEIGNANT ====================
exports.ajouterEnseignant = async (req, res) => {
  try {
    console.log("📥 [AJOUT ENSEIGNANT] Body:", req.body);
    console.log("📥 [AJOUT ENSEIGNANT] File:", req.file);

    const {
      matricule,
      nom,
      prenom,
      genre,
      adresse,
      telephone,
      matiere,
      matieres,
      heures,
      email,
      dateAjout,
    } = req.body;

    // ✅ Validation
    if (!nom?.trim() || !prenom?.trim()) {
      if (req.file) deleteFile(`/uploads/cv/${req.file.filename}`);
      return res.status(400).json({
        message: "Le nom et le prénom sont obligatoires",
      });
    }

    // ✅ Parse des matières (multi)
    const matieresList = parseMatieres(matieres || matiere);

    // ✅ Matricule auto si vide
    let finalMatricule = matricule?.trim();
    if (!finalMatricule) {
      finalMatricule = await generateMatricule();
    } else {
      const existing = await Enseignant.findOne({ matricule: finalMatricule });
      if (existing) {
        if (req.file) deleteFile(`/uploads/cv/${req.file.filename}`);
        return res.status(400).json({
          message: `Le matricule ${finalMatricule} existe déjà`,
        });
      }
    }

    // ✅ Création (⚠️ nomComplet est un virtual → NE PAS le sauver)
    const newEnseignant = new Enseignant({
      matricule: finalMatricule,
      nom: nom.trim(),
      prenom: prenom.trim(),
      genre: genre || "",
      adresse: adresse || "",
      telephone: telephone || "",
      matieres: matieresList,                    // ✅ tableau
      matiere: matieresList[0] || "",            // ✅ sync compat
      heures: heures || "",
      email: email || "",
      dateAjout: dateAjout ? new Date(dateAjout) : new Date(),
      cv: req.file ? `/uploads/cv/${req.file.filename}` : null,
    });

    await newEnseignant.save();

    console.log(
      "✅ Enseignant ajouté:",
      newEnseignant.matricule,
      "— matières:",
      newEnseignant.matieres
    );

    return res.status(201).json({
      message: "Enseignant ajouté avec succès",
      enseignant: newEnseignant,
    });
  } catch (error) {
    console.error("❌ [AJOUT ENSEIGNANT] Erreur:", error);
    if (req.file) deleteFile(`/uploads/cv/${req.file.filename}`);
    return res.status(500).json({
      message: "Erreur lors de l'ajout de l'enseignant",
      error: error.message,
    });
  }
};

// ==================== LISTER TOUS LES ENSEIGNANTS ====================
exports.getTousEnseignants = async (req, res) => {
  try {
    const { matiere } = req.query; // ✅ filtre optionnel par matière

    const filtre = {};
    if (matiere) {
      filtre.$or = [
        { matieres: matiere },
        { matiere: matiere },
      ];
    }

    const enseignants = await Enseignant.find(filtre).sort({ createdAt: -1 });

    console.log(`📤 ${enseignants.length} enseignant(s) envoyé(s)`);

    return res.status(200).json({
      message: "Liste des enseignants récupérée avec succès",
      enseignants,
      total: enseignants.length,
    });
  } catch (error) {
    console.error("❌ [GET ENSEIGNANTS] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des enseignants",
      error: error.message,
    });
  }
};

// ==================== OBTENIR UN ENSEIGNANT PAR ID ====================
exports.getEnseignantById = async (req, res) => {
  try {
    const { id } = req.params;

    const enseignant = await Enseignant.findById(id);

    if (!enseignant) {
      return res.status(404).json({ message: "Enseignant introuvable" });
    }

    return res.status(200).json({
      message: "Enseignant récupéré avec succès",
      enseignant,
    });
  } catch (error) {
    console.error("❌ [GET ENSEIGNANT BY ID] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération de l'enseignant",
      error: error.message,
    });
  }
};

// ==================== MODIFIER UN ENSEIGNANT ====================
exports.modifierEnseignant = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📝 [MODIF ENSEIGNANT] ID:", id);
    console.log("📝 [MODIF ENSEIGNANT] Body:", req.body);
    console.log("📝 [MODIF ENSEIGNANT] File:", req.file);

    const enseignant = await Enseignant.findById(id);

    if (!enseignant) {
      if (req.file) deleteFile(`/uploads/cv/${req.file.filename}`);
      return res.status(404).json({ message: "Enseignant introuvable" });
    }

    const {
      matricule,
      nom,
      prenom,
      genre,
      adresse,
      telephone,
      matiere,
      matieres,
      heures,
      email,
      dateAjout,
    } = req.body;

    // ✅ Construire l'objet de mise à jour
    const updateData = {};

    if (nom !== undefined && nom !== "") updateData.nom = nom.trim();
    if (prenom !== undefined && prenom !== "") updateData.prenom = prenom.trim();

    // ⚠️ nomComplet est un virtual dans le modèle → NE PAS le mettre dans updateData

    // Matricule (si fourni et différent)
    if (
      matricule !== undefined &&
      matricule.trim() &&
      matricule.trim() !== enseignant.matricule
    ) {
      const existing = await Enseignant.findOne({
        matricule: matricule.trim(),
        _id: { $ne: id },
      });
      if (existing) {
        if (req.file) deleteFile(`/uploads/cv/${req.file.filename}`);
        return res.status(400).json({
          message: `Le matricule ${matricule} est déjà utilisé`,
        });
      }
      updateData.matricule = matricule.trim();
    }

    if (genre !== undefined) updateData.genre = genre;
    if (adresse !== undefined) updateData.adresse = adresse;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (heures !== undefined) updateData.heures = heures;
    if (email !== undefined) updateData.email = email;
    if (dateAjout !== undefined && dateAjout) updateData.dateAjout = new Date(dateAjout);

    // ✅ Gestion des matières (priorité à `matieres` s'il est fourni)
    if (matieres !== undefined) {
      const matieresList = parseMatieres(matieres);
      updateData.matieres = matieresList;
      updateData.matiere = matieresList[0] || ""; // sync compat
    } else if (matiere !== undefined) {
      // Rétro-compat : si seul `matiere` est envoyé
      const matieresList = parseMatieres(matiere);
      updateData.matieres = matieresList;
      updateData.matiere = matieresList[0] || "";
    }

    // ✅ Nouveau CV (si upload) → supprimer l'ancien
    if (req.file) {
      if (enseignant.cv) deleteFile(enseignant.cv);
      updateData.cv = `/uploads/cv/${req.file.filename}`;
    }

    const updatedEnseignant = await Enseignant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log("✅ Enseignant modifié:", updatedEnseignant.matricule);

    return res.status(200).json({
      message: "Enseignant modifié avec succès",
      enseignant: updatedEnseignant,
    });
  } catch (error) {
    console.error("❌ [MODIF ENSEIGNANT] Erreur:", error);
    if (req.file) deleteFile(`/uploads/cv/${req.file.filename}`);
    return res.status(500).json({
      message: "Erreur lors de la modification de l'enseignant",
      error: error.message,
    });
  }
};

// ==================== SUPPRIMER UN ENSEIGNANT ====================
exports.supprimerEnseignant = async (req, res) => {
  try {
    const { id } = req.params;

    const enseignant = await Enseignant.findById(id);

    if (!enseignant) {
      return res.status(404).json({ message: "Enseignant introuvable" });
    }

    // Supprimer le CV du disque
    if (enseignant.cv) deleteFile(enseignant.cv);

    await Enseignant.findByIdAndDelete(id);

    console.log("🗑️ Enseignant supprimé:", enseignant.matricule);

    return res.status(200).json({
      message: "Enseignant supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ [DELETE ENSEIGNANT] Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la suppression de l'enseignant",
      error: error.message,
    });
  }
};

// ==================== 🆕 BONUS : ENSEIGNANTS PAR MATIÈRE ====================
exports.getEnseignantsParMatiere = async (req, res) => {
  try {
    const { matiere } = req.params;

    if (!matiere) {
      return res.status(400).json({ message: "Le paramètre matière est requis" });
    }

    const enseignants = await Enseignant.find({
      $or: [
        { matieres: matiere },
        { matiere: matiere },
      ],
    }).sort({ nom: 1 });

    return res.status(200).json({
      message: `Enseignants de ${matiere}`,
      matiere,
      count: enseignants.length,
      enseignants,
    });
  } catch (error) {
    console.error("❌ [GET ENSEIGNANTS PAR MATIÈRE] Erreur:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// ==================== 🆕 BONUS : LISTE DES MATIÈRES ====================
exports.getToutesMatieres = async (req, res) => {
  try {
    // Agrégation pour extraire toutes les matières uniques
    const result = await Enseignant.aggregate([
      // Décompose le tableau `matieres`
      { $unwind: { path: "$matieres", preserveNullAndEmptyArrays: false } },
      // Groupe pour avoir les uniques
      { $group: { _id: "$matieres" } },
      // Trie alphabétique
      { $sort: { _id: 1 } },
    ]);

    // Récupère aussi les anciennes matières (champ `matiere`)
    const anciennes = await Enseignant.distinct("matiere");

    // Fusion et nettoyage
    const toutes = [
      ...new Set([
        ...result.map((r) => r._id).filter(Boolean),
        ...anciennes.filter(Boolean),
      ]),
    ].sort((a, b) => a.localeCompare(b, "fr"));

    return res.status(200).json({
      message: "Liste de toutes les matières",
      count: toutes.length,
      matieres: toutes,
    });
  } catch (error) {
    console.error("❌ [GET TOUTES MATIÈRES] Erreur:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};