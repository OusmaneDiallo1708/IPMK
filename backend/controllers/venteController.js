const mongoose = require('mongoose');
const ObjectID = mongoose.Types.ObjectId;
const venteModel = require('../models/venteModel');
const produitModel = require('../models/produitModel');
const utilisateurModel = require('../models/utilisateurModel');
const Archive = require('../models/Archive');
const Stock = require('../models/Stock'); // ✅ AJOUTÉ

// @desc    Ajouter une vente
module.exports.addVente = async (req, res) => {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        
        const { produitId, utilisateurId, quantite, prix_unitaire, date_vente } = req.body;

        if (!produitId || !utilisateurId || !quantite || !prix_unitaire) {
            return res.status(400).json({ 
                success: false,
                message: "Champs requis: produitId, utilisateurId, quantite, prix_unitaire" 
            });
        }

        const quantiteNum = Number(quantite);
        const prixNum = parseFloat(prix_unitaire);
        
        if (isNaN(quantiteNum) || isNaN(prixNum) || quantiteNum <= 0 || prixNum <= 0) {
            return res.status(400).json({ 
                success: false,
                message: "Quantité et prix doivent être des nombres positifs" 
            });
        }

        const produit = await produitModel.findById(produitId).session(session);
        if (!produit) {
            return res.status(404).json({ success: false, message: "Produit introuvable" });
        }

        if (!produit.autoriserModificationPrixVente && prixNum !== produit.prixVente) {
            return res.status(400).json({
                success: false,
                message: `Modification du prix non autorisée pour ce produit. Le prix doit être ${produit.prixVente} GNF.`
            });
        }

        const prixEffectif = produit.autoriserModificationPrixVente ? prixNum : produit.prixVente;

        if (produit.stock < quantiteNum) {
            return res.status(400).json({ 
                success: false,
                message: "Stock insuffisant",
                stockDisponible: produit.stock
            });
        }

        const utilisateur = await utilisateurModel.findById(utilisateurId).session(session);
        if (!utilisateur) {
            return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
        }

        const nouvelleVente = new venteModel({
            produit: produitId,
            produitNom: produit.nom || produit.categorieNom || 'Nom inconnu',
            produitDescription: produit.description || produit.categorieDescription || '',
            utilisateur: utilisateurId,
            utilisateurNom: utilisateur.nom || utilisateur.username || 'Utilisateur',
            quantite: quantiteNum,
            prix_unitaire: prixEffectif,
            montantT: quantiteNum * prixEffectif,
            date_vente: date_vente || new Date(),
            montantEncaissé: 0 // ✅ Valeur par défaut
        });

        const venteSauvegardee = await nouvelleVente.save({ session });

        produit.stock -= quantiteNum;
        await produit.save({ session });

        await session.commitTransaction();
        
        res.status(201).json({
            success: true,
            message: "Vente enregistrée avec succès",
            vente: venteSauvegardee,
            nouveauStock: produit.stock
        });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('Erreur addVente:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'enregistrement de la vente",
            error: error.message
        });
    } finally {
        if (session) session.endSession();
    }
};

// @desc    Récupérer toutes les ventes
module.exports.getAllVentes = async (req, res) => {
    try {
        const ventes = await venteModel.find().sort({ date_vente: -1 });
        res.status(200).json({ 
            success: true,
            message: "Liste des ventes", 
            count: ventes.length,
            ventes 
        });
    } catch (error) {
        console.error('Erreur getAllVentes:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération', 
            error: error.message 
        });
    }
};

// @desc    Récupérer une seule vente
module.exports.getUneVente = async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectID.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID invalide" });
        }

        const vente = await venteModel.findById(id);
        if (!vente) {
            return res.status(404).json({ success: false, message: "Vente non trouvée" });
        }
        
        res.status(200).json({ 
            success: true,
            message: "Vente trouvée", 
            vente 
        });
    } catch (error) {
        console.error('Erreur getUneVente:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération', 
            error: error.message 
        });
    }
};

// @desc    Modifier une vente
module.exports.updateVente = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { quantite, prix_unitaire, date_vente } = req.body;

        if (!ObjectID.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID invalide' });
        }

        const venteExistante = await venteModel.findById(id).session(session);
        if (!venteExistante) {
            return res.status(404).json({ success: false, message: 'Vente non trouvée' });
        }

        const produit = await produitModel.findById(venteExistante.produit).session(session);
        if (!produit) {
            return res.status(404).json({ success: false, message: "Produit introuvable" });
        }

        const ancienneQuantite = venteExistante.quantite;
        const nouvelleQuantite = Number(quantite) || ancienneQuantite;
        const differenceQuantite = nouvelleQuantite - ancienneQuantite;

        if (differenceQuantite !== 0) {
            if (differenceQuantite > 0 && produit.stock < differenceQuantite) {
                return res.status(400).json({
                    success: false,
                    message: "Stock insuffisant",
                    stockDisponible: produit.stock
                });
            }
            produit.stock -= differenceQuantite;
            await produit.save({ session });
        }

        venteExistante.quantite = nouvelleQuantite;
        if (prix_unitaire !== undefined) venteExistante.prix_unitaire = Number(prix_unitaire);
        if (date_vente !== undefined) venteExistante.date_vente = date_vente;
        venteExistante.montantT = venteExistante.quantite * venteExistante.prix_unitaire;

        await venteExistante.save({ session });
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Vente modifiée avec succès',
            vente: venteExistante,
            nouveauStock: produit.stock
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Erreur updateVente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// @desc    Supprimer une vente (avec archivage automatique)
module.exports.deleteVente = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        if (!ObjectID.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID invalide" });
        }

        const vente = await venteModel.findById(id).session(session);
        if (!vente) {
            return res.status(404).json({ success: false, message: "Vente non trouvée" });
        }

        // ✅ 1. Archiver la vente avant de la supprimer
        const archive = new Archive({
            type: 'vente',
            data: [vente],
            montantTotal: vente.montantT || 0,
            archivePar: req.user?.nomComplet || req.user?.nom || 'Suppression manuelle'
        });
        await archive.save({ session });

        // ✅ 2. Restituer le stock
        const produit = await produitModel.findById(vente.produit).session(session);
        if (produit) {
            produit.stock += vente.quantite;
            await produit.save({ session });
        }

        // ✅ 3. Supprimer définitivement la vente
        await venteModel.findByIdAndDelete(id).session(session);

        await session.commitTransaction();

        res.status(200).json({ 
            success: true,
            message: "Vente supprimée et archivée avec succès",
            archiveId: archive._id,
            stockRestitue: vente.quantite
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Erreur deleteVente:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la suppression', 
            error: error.message 
        });
    } finally {
        session.endSession();
    }
};

// ==================== STATISTIQUES ====================

module.exports.getTotalVentesParJour = async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;
        const result = await venteModel.getTotalVentesParJour(date_debut, date_fin);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports.getTotalVentesParMois = async (req, res) => {
    try {
        const { annee } = req.query;
        const result = await venteModel.getTotalVentesParMois(annee);
        const resultAvecNoms = result.map(item => ({
            annee: item._id.annee,
            mois: item._id.mois,
            nomMois: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][item._id.mois - 1],
            totalVentes: item.totalVentes,
            quantiteTotale: item.quantiteTotale,
            nombreVentes: item.nombreVentes
        }));
        res.status(200).json({ success: true, data: resultAvecNoms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports.getTotalVentesParAnnee = async (req, res) => {
    try {
        const result = await venteModel.getTotalVentesParAnnee();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports.getStatsVentesCompletes = async (req, res) => {
    try {
        const now = new Date();
        const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const debutSemaine = new Date(now);
        debutSemaine.setDate(now.getDate() - 7);
        const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
        const debutAnnee = new Date(now.getFullYear(), 0, 1);
        
        const [aujourdhui, cetteSemaine, ceMois, cetteAnnee, totalGeneral, topProduits] = await Promise.all([
            venteModel.aggregate([{ $match: { date_vente: { $gte: debutJour } } }, { $group: { _id: null, total: { $sum: '$montantT' }, quantite: { $sum: '$quantite' }, count: { $sum: 1 } } }]),
            venteModel.aggregate([{ $match: { date_vente: { $gte: debutSemaine } } }, { $group: { _id: null, total: { $sum: '$montantT' }, quantite: { $sum: '$quantite' }, count: { $sum: 1 } } }]),
            venteModel.aggregate([{ $match: { date_vente: { $gte: debutMois } } }, { $group: { _id: null, total: { $sum: '$montantT' }, quantite: { $sum: '$quantite' }, count: { $sum: 1 } } }]),
            venteModel.aggregate([{ $match: { date_vente: { $gte: debutAnnee } } }, { $group: { _id: null, total: { $sum: '$montantT' }, quantite: { $sum: '$quantite' }, count: { $sum: 1 } } }]),
            venteModel.aggregate([{ $group: { _id: null, total: { $sum: '$montantT' }, quantite: { $sum: '$quantite' }, count: { $sum: 1 } } }]),
            venteModel.aggregate([
                { $group: { _id: '$produitNom', totalVentes: { $sum: '$montantT' }, quantiteVendue: { $sum: '$quantite' } } },
                { $sort: { totalVentes: -1 } },
                { $limit: 5 }
            ])
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                aujourdhui: aujourdhui[0] || { total: 0, quantite: 0, count: 0 },
                cetteSemaine: cetteSemaine[0] || { total: 0, quantite: 0, count: 0 },
                ceMois: ceMois[0] || { total: 0, quantite: 0, count: 0 },
                cetteAnnee: cetteAnnee[0] || { total: 0, quantite: 0, count: 0 },
                totalGeneral: totalGeneral[0] || { total: 0, quantite: 0, count: 0 },
                topProduits
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ARCHIVES DES VENTES ====================

module.exports.archiverEtViderVentes = async (req, res) => {
    try {
        const ventes = await venteModel.find({});
        if (ventes.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucune vente à archiver',
                archive: { count: 0, montantTotal: 0 }
            });
        }
        
        const montantTotal = ventes.reduce((sum, v) => sum + (v.montantT || 0), 0);
        
        const archive = new Archive({
            type: 'vente',
            data: ventes,
            montantTotal: montantTotal,
            archivePar: req.user?.nom || 'Caisse'
        });
        
        await archive.save();
        await venteModel.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: `${ventes.length} ventes archivées avec succès`,
            archive: {
                id: archive._id,
                date: archive.dateArchivage,
                total: montantTotal,
                count: ventes.length
            }
        });
    } catch (error) {
        console.error('Erreur archiverEtViderVentes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ENCAISSER UNE VENTE ====================

// @desc    Encaisser une partie ou la totalité d'une vente vers la caisse
// @route   POST /api/ventes/encaisser/:id
exports.encaisserVente = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const { montant } = req.body;

        if (!montant || montant <= 0) {
            return res.status(400).json({ success: false, message: "Montant invalide" });
        }

        const vente = await venteModel.findById(id).session(session);
        if (!vente) {
            return res.status(404).json({ success: false, message: "Vente non trouvée" });
        }

        // ✅ Calcul du reste à encaisser
        const montantEncaissé = vente.montantEncaissé || 0;
        const reste = vente.montantT - montantEncaissé;
        if (montant > reste) {
            return res.status(400).json({ 
                success: false, 
                message: `Le montant ne peut pas dépasser le reste à encaisser : ${reste} GNF` 
            });
        }

        // ✅ Mettre à jour le montant encaissé
        vente.montantEncaissé = montantEncaissé + montant;
        await vente.save({ session });

        // ✅ Créer une entrée dans Stock (entrée) pour alimenter la fluidité
        const stockEntry = new Stock({
            date: new Date(),
            lieu: "Encaissement vente",
            detail: `Encaissement de la vente ${vente._id} - ${vente.produitNom}`,
            type: "entree",
            montant: montant,
            quantite: 1,
            prixUnitaire: montant,
            montantTotal: 0 // sera recalculé
        });
        await stockEntry.save({ session });

        // ✅ Recalculer le total des stocks (comme dans stockController)
        const allStocks = await Stock.find().sort({ date: 1, _id: 1 }).session(session);
        let cumul = 0;
        for (const s of allStocks) {
            if (s.type === 'entree') cumul += s.montant;
            else if (s.type === 'sortie') cumul -= s.montant;
            s.montantTotal = cumul;
            await s.save({ session });
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: `Encaissement de ${montant} GNF effectué avec succès`,
            vente: {
                _id: vente._id,
                montantT: vente.montantT,
                montantEncaissé: vente.montantEncaissé,
                reste: vente.montantT - vente.montantEncaissé
            }
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Erreur encaissement:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};