const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const etudiantModel = require('../models/EtudiantModel');
const ObjectID = require('mongoose').Types.ObjectId;

// ==================================================
// ============ HELPER : PARSE FORMDATA =============
// ==================================================
function parseIfString(value) {
    if (value === null || value === undefined) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return {}; }
    }
    return {};
}

// ==================================================
// ==================== LOGIN =======================
// ==================================================
module.exports.login = async (req, res) => {
    const { identifiant, motDePasse } = req.body;

    if (!identifiant || !motDePasse) {
        return res.status(400).json({
            success: false,
            message: "Identifiant (email ou matricule) et mot de passe requis"
        });
    }

    try {
        const etudiant = await etudiantModel.login(identifiant, motDePasse);
        if (!etudiant) {
            return res.status(401).json({
                success: false,
                message: "Identifiants invalides"
            });
        }

        if (!etudiant.actif) {
            return res.status(403).json({
                success: false,
                message: "Votre compte est en attente d'activation",
                code: "ACCOUNT_INACTIVE"
            });
        }

        const token = jwt.sign(
            { id: etudiant._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const etudiantData = etudiant.toObject();
        delete etudiantData.motDePasse;

        res.status(200).json({
            success: true,
            message: "Connexion réussie",
            token,
            etudiant: etudiantData
        });

    } catch (error) {
        console.error("❌ Erreur login:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// ============ GÉNÉRER MATRICULE AUTO ==============
// ==================================================
async function genererMatricule() {
    const annee = new Date().getFullYear();
    const prefix = `ETU${annee}`;

    const dernier = await etudiantModel
        .findOne({ matricule: new RegExp(`^${prefix}`) })
        .sort({ matricule: -1 });

    let numero = 1;
    if (dernier?.matricule) {
        const num = parseInt(dernier.matricule.replace(prefix, ''), 10);
        if (!isNaN(num)) numero = num + 1;
    }

    return `${prefix}${String(numero).padStart(4, '0')}`;
}

// ==================================================
// ============ AJOUTER UN ÉTUDIANT =================
// ==================================================
module.exports.ajoutEtudiant = async (req, res) => {
    console.log("📦 [ajoutEtudiant] req.body =", req.body);
    console.log("📦 [ajoutEtudiant] req.file =", req.file);

    try {
        // ✅ AJOUT : récupération de `ina`
        const { ina, matricule, nom, prenom, genre } = req.body;
        const contacts = parseIfString(req.body.contacts);
        const contacts_titre = parseIfString(req.body.contacts_titre);

        console.log("📦 contacts parsé =", contacts);
        console.log("📦 contacts_titre parsé =", contacts_titre);

        // ✅ Validation minimale
        if (!nom || !prenom) {
            return res.status(400).json({
                success: false,
                message: "Le nom et le prénom sont obligatoires"
            });
        }

        // ✅ AJOUT : INA obligatoire
        if (!ina || ina.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "L'INA est obligatoire"
            });
        }

        // ✅ AJOUT : Vérif unicité de l'INA
        const existIna = await etudiantModel.findOne({
            ina: ina.trim().toUpperCase()
        });
        if (existIna) {
            return res.status(400).json({
                success: false,
                message: "Cet INA est déjà utilisé"
            });
        }

        // Vérif email (uniquement si fourni)
        if (contacts.email) {
            const existant = await etudiantModel.findOne({
                'contacts.email': contacts.email.toLowerCase()
            });
            if (existant) {
                return res.status(400).json({
                    success: false,
                    message: "Cet email est déjà utilisé"
                });
            }
        }

        // Vérif matricule (uniquement si fourni)
        if (matricule && matricule.trim() !== '') {
            const existMatricule = await etudiantModel.findOne({
                matricule: matricule.toUpperCase()
            });
            if (existMatricule) {
                return res.status(400).json({
                    success: false,
                    message: "Ce matricule est déjà utilisé"
                });
            }
        }

        // Matricule auto si vide
        let matriculeFinal = matricule?.trim().toUpperCase() || null;
        if (!matriculeFinal) {
            matriculeFinal = await genererMatricule();
        }

        // Photo (si uploadée)
        let photoPath = null;
        if (req.file) {
            photoPath = `/uploads/etudiants/${req.file.filename}`;
        }

        // ✅ Création avec TOUS les champs du nouveau modèle
        const etudiant = new etudiantModel({
            ina: ina.trim().toUpperCase(),          // ✅ AJOUT
            matricule: matriculeFinal,
            nom: nom.trim(),
            prenom: prenom.trim(),
            genre: genre || 'Homme',

            contacts: {
                telephone: contacts.telephone || null,
                email:     contacts.email ? contacts.email.toLowerCase() : null,
                whatsapp:  contacts.whatsapp || null,
                adresse:   contacts.adresse || null
            },

            contacts_titre: {
                nom:       contacts_titre.nom || null,
                telephone: contacts_titre.telephone || null,
                email:     contacts_titre.email || null,
                fonction:  contacts_titre.fonction || null
            },

            titre: 'etudiant',
            photo: photoPath,

            // Statut compte
            actif: false,
            dateAjout: new Date(),

            // Inscription / Réinscription
            inscrit: false,
            anneeInscriptionActuelle: null,
            derniereClasse: null,
            dernierNiveau: null,
            derniereOption: null,
            derniereInscriptionId: null,
            nombreInscriptions: 0
        });

        await etudiant.save();

        res.status(201).json({
            success: true,
            message: `${etudiant.nomComplet || etudiant.prenom + ' ' + etudiant.nom} a été ajouté avec succès`,
            etudiant: {
                _id: etudiant._id,
                ina: etudiant.ina,                     // ✅ AJOUT
                matricule: etudiant.matricule,
                nom: etudiant.nom,
                prenom: etudiant.prenom,
                nomComplet: etudiant.nomComplet,
                genre: etudiant.genre,
                contacts: etudiant.contacts,
                contacts_titre: etudiant.contacts_titre,
                titre: etudiant.titre,
                actif: etudiant.actif,
                inscrit: etudiant.inscrit,
                dateAjout: etudiant.dateAjout,
                photo: etudiant.photo
            }
        });

    } catch (error) {
        console.error("❌ Erreur ajoutEtudiant:", error.message);
        console.error("❌ Stack:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Erreur de validation",
                errors: Object.keys(error.errors).map(k => error.errors[k].message)
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Doublon détecté (INA, matricule ou email déjà utilisé)",
                details: error.keyValue
            });
        }

        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// ==================================================
// ============ LISTER TOUS LES ÉTUDIANTS ===========
// ==================================================
module.exports.getAllEtudiants = async (req, res) => {
    try {
        const etudiants = await etudiantModel
            .find()
            .select('-motDePasse')
            .sort({ dateAjout: -1 });

        res.status(200).json({
            success: true,
            message: "Liste des étudiants",
            count: etudiants.length,
            etudiants
        });

    } catch (error) {
        console.error("❌ Erreur getAllEtudiants:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// ============ AFFICHER UN ÉTUDIANT ================
// ==================================================
module.exports.getUnEtudiant = async (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID invalide" });
    }

    try {
        const etudiant = await etudiantModel
            .findById(id)
            .select('-motDePasse')
            .populate('derniereInscriptionId');

        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        res.status(200).json({
            success: true,
            message: "Détails de l'étudiant",
            etudiant
        });

    } catch (error) {
        console.error("❌ Erreur getUnEtudiant:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// ============ MODIFIER UN ÉTUDIANT ================
// ==================================================
module.exports.modifierEtudiant = async (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID invalide" });
    }

    try {
        const etudiantExistant = await etudiantModel.findById(id);
        if (!etudiantExistant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        const isAdmin = req.user && ['admin', 'superAdmin'].includes(req.user.role);
        const isSelf = req.user && req.user._id.toString() === id;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "Vous ne pouvez modifier que votre propre profil"
            });
        }

        const contacts = parseIfString(req.body.contacts);
        const contacts_titre = parseIfString(req.body.contacts_titre);

        const updateData = {
            nom: req.body.nom,
            prenom: req.body.prenom,
            genre: req.body.genre,
            'contacts.telephone': contacts.telephone || null,
            'contacts.email':     contacts.email ? contacts.email.toLowerCase() : null,
            'contacts.whatsapp':  contacts.whatsapp || null,
            'contacts.adresse':   contacts.adresse || null,
            'contacts_titre.nom':       contacts_titre.nom || null,
            'contacts_titre.telephone': contacts_titre.telephone || null,
            'contacts_titre.email':     contacts_titre.email || null,
            'contacts_titre.fonction':  contacts_titre.fonction || null
        };

        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        if (isAdmin && req.body.titre) {
            updateData.titre = req.body.titre;
        }

        if (req.file) {
            updateData.photo = `/uploads/etudiants/${req.file.filename}`;
        }

        if (req.body.motDePasse && req.body.motDePasse.length >= 6) {
            const salt = await bcrypt.genSalt(10);
            updateData.motDePasse = await bcrypt.hash(req.body.motDePasse, salt);
        }

        const etudiant = await etudiantModel
            .findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            )
            .select('-motDePasse');

        res.status(200).json({
            success: true,
            message: `${etudiant.nomComplet} a été modifié avec succès`,
            etudiant
        });

    } catch (error) {
        console.error("❌ Erreur modifierEtudiant:", error.message);
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
};

// ==================================================
// ============ SUPPRIMER UN ÉTUDIANT ===============
// ==================================================
module.exports.supprimerEtudiant = async (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID invalide" });
    }

    try {
        const etudiant = await etudiantModel.findById(id);
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        const isAdmin = req.user && ['admin', 'superAdmin'].includes(req.user.role);
        const isSelf = req.user && req.user._id.toString() === id;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "Vous ne pouvez supprimer que votre propre compte"
            });
        }

        if (etudiant.titre === 'superAdmin' && req.user.role !== 'superAdmin') {
            return res.status(403).json({
                success: false,
                message: "Seul un Super Admin peut supprimer un Super Admin"
            });
        }

        await etudiantModel.findByIdAndDelete(id);

        // (Optionnel) Supprimer aussi les inscriptions liées
        try {
            const inscriptionModel = require('../models/InscriptionModel');
            await inscriptionModel.deleteMany({ etudiant: id });
        } catch (e) {
            console.warn("⚠️ Inscriptions non supprimées:", e.message);
        }

        res.status(200).json({
            success: true,
            message: `${etudiant.nomComplet} a été supprimé avec succès`
        });

    } catch (error) {
        console.error("❌ Erreur supprimerEtudiant:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// ============ ACTIVER UN ÉTUDIANT =================
// ==================================================
module.exports.activerEtudiant = async (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID invalide" });
    }

    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Accès non autorisé"
        });
    }

    try {
        const etudiant = await etudiantModel.findById(id);
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        if (etudiant.actif) {
            return res.status(400).json({
                success: false,
                message: "Cet étudiant est déjà actif"
            });
        }

        etudiant.actif = true;
        etudiant.dateActivation = new Date();
        etudiant.activePar = req.user._id;
        await etudiant.save();

        res.status(200).json({
            success: true,
            message: `✅ Le compte de ${etudiant.nomComplet} a été activé`,
            etudiant: {
                _id: etudiant._id,
                nomComplet: etudiant.nomComplet,
                actif: etudiant.actif,
                titre: etudiant.titre
            }
        });

    } catch (error) {
        console.error("❌ Erreur activerEtudiant:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// ============ DÉSACTIVER UN ÉTUDIANT ==============
// ==================================================
module.exports.desactiverEtudiant = async (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID invalide" });
    }

    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Accès non autorisé"
        });
    }

    try {
        const etudiant = await etudiantModel.findById(id);
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: "Étudiant non trouvé"
            });
        }

        if (etudiant._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Vous ne pouvez pas désactiver votre propre compte"
            });
        }

        etudiant.actif = false;
        await etudiant.save();

        res.status(200).json({
            success: true,
            message: `⚠️ Le compte de ${etudiant.nomComplet} a été désactivé`,
            etudiant: {
                _id: etudiant._id,
                nomComplet: etudiant.nomComplet,
                actif: etudiant.actif
            }
        });

    } catch (error) {
        console.error("❌ Erreur desactiverEtudiant:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// ======== ÉTUDIANTS EN ATTENTE D'ACTIVATION =======
// ==================================================
module.exports.getEtudiantsEnAttente = async (req, res) => {
    console.log("🔍 [en-attente] req.user =", req.user ? {
        email: req.user.email,
        role: req.user.role
    } : null);

    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
        console.log("❌ [en-attente] Refusé. Rôle:", req.user?.role);
        return res.status(403).json({
            success: false,
            message: "Accès non autorisé"
        });
    }

    try {
        const etudiants = await etudiantModel
            .find({ actif: false })
            .select('-motDePasse')
            .sort({ dateAjout: -1 });

        res.status(200).json({
            success: true,
            count: etudiants.length,
            message: `${etudiants.length} étudiant(s) en attente d'activation`,
            etudiants
        });

    } catch (error) {
        console.error("❌ Erreur getEtudiantsEnAttente:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

// ==================================================
// === ÉTUDIANTS RÉINSCRIPTIBLES POUR UNE ANNÉE ====
// ==================================================
module.exports.getEtudiantsReinscriptibles = async (req, res) => {
    const { anneeScolaire } = req.query;

    console.log("🔍 [reinscriptibles] anneeScolaire =", anneeScolaire);

    if (!anneeScolaire) {
        return res.status(400).json({
            success: false,
            message: "Le paramètre anneeScolaire est requis (ex: 2027-2028)"
        });
    }

    try {
        const inscriptionModel = require('../models/InscriptionModel');

        const inscriptionsAnnee = await inscriptionModel
            .find({ anneeScolaire, statut: 'validee' })
            .select('etudiant');

        const idsInscritsCetteAnnee = inscriptionsAnnee.map(i => i.etudiant.toString());

        const etudiants = await etudiantModel
            .find({
                inscrit: true,
                actif: true
            })
            .select('-motDePasse')
            .sort({ nom: 1 });

        const reinscriptibles = etudiants.filter(
            e => !idsInscritsCetteAnnee.includes(e._id.toString())
        );

        res.status(200).json({
            success: true,
            anneeScolaire,
            count: reinscriptibles.length,
            etudiants: reinscriptibles
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

    console.log("🔍 [non-inscrits] anneeScolaire =", anneeScolaire);

    if (!anneeScolaire) {
        return res.status(400).json({
            success: false,
            message: "Le paramètre anneeScolaire est requis"
        });
    }

    try {
        const inscriptionModel = require('../models/InscriptionModel');

        const inscriptionsAnnee = await inscriptionModel
            .find({ anneeScolaire, statut: 'validee' })
            .select('etudiant');

        const idsInscritsCetteAnnee = inscriptionsAnnee.map(i => i.etudiant.toString());

        const etudiants = await etudiantModel
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
            etudiants: nonInscrits
        });

    } catch (error) {
        console.error("❌ Erreur getEtudiantsNonInscrits:", error.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};