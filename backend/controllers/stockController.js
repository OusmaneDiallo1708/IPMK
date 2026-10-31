// controllers/stockController.js
console.log("🔥 NOUVELLE VERSION - 04/06/2026 23:30 - CACHE VIDÉ 🔥");

const Stock = require('../models/Stock');
const Produit = require('../models/produitModel');
const mongoose = require('mongoose');
const Archive = require('../models/Archive');

// ==================== CRÉER UN MOUVEMENT DE STOCK ====================
exports.createStock = async (req, res) => {
    try {
        const { date, lieu, detail, type, montant, quantite, prixUnitaire, produitId } = req.body;
        
        console.log("🔥 NOUVEAU CONTROLLER - Données reçues:", { date, lieu, detail, type, montant });
        
        if (!lieu) {
            return res.status(400).json({ success: false, message: "Le lieu est requis" });
        }
        if (!detail) {
            return res.status(400).json({ success: false, message: "Le détail est requis" });
        }
        if (!type) {
            return res.status(400).json({ success: false, message: "Le type est requis (entree ou sortie)" });
        }
        if (!montant || montant <= 0) {
            return res.status(400).json({ success: false, message: "Le montant doit être un nombre positif" });
        }
        
        const allStocks = await Stock.find().sort({ date: 1, _id: 1 });
        let totalActuel = 0;
        
        for (const s of allStocks) {
            if (s.type === 'entree') totalActuel += s.montant;
            if (s.type === 'sortie') totalActuel -= s.montant;
        }
        
        let nouveauTotal = totalActuel;
        
        if (type === 'entree') {
            nouveauTotal = totalActuel + montant;
        } else {
            if (totalActuel < montant) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Stock insuffisant ! Stock actuel: ${totalActuel.toLocaleString()} GNF` 
                });
            }
            nouveauTotal = totalActuel - montant;
        }
        
        const stock = await Stock.create({
            date: date || new Date(),
            lieu,
            detail,
            type,
            montant,
            quantite: quantite || 1,
            prixUnitaire: prixUnitaire || montant,
            montantTotal: nouveauTotal,
            quantiteTotal: 0
        });
        
        console.log(`✅ ${type === 'entree' ? 'Entrée' : 'Sortie'} créée: ${montant} GNF`);
        
        res.status(201).json({
            success: true,
            message: `${type === 'entree' ? 'Entrée' : 'Sortie'} enregistrée avec succès!`,
            data: { 
                stock: {
                    _id: stock._id,
                    date: stock.date,
                    lieu: stock.lieu,
                    detail: stock.detail,
                    entre: stock.type === 'entree' ? stock.montant : 0,
                    sortie: stock.type === 'sortie' ? stock.montant : 0,
                    total: stock.montantTotal
                },
                nouveauTotal 
            }
        });
    } catch (error) {
        console.error("❌ Erreur createStock:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== LISTER LES STOCKS ====================
exports.getStocks = async (req, res) => {
    try {
        const { page = 1, limit = 20, lieu, date_debut, date_fin, type, search } = req.query;
        const query = {};
        
        if (lieu) query.lieu = lieu;
        if (type) query.type = type;
        if (date_debut) query.date = { ...query.date, $gte: new Date(date_debut) };
        if (date_fin) query.date = { ...query.date, $lte: new Date(date_fin) };
        if (search) {
            query.$or = [
                { lieu: { $regex: search, $options: 'i' } },
                { detail: { $regex: search, $options: 'i' } }
            ];
        }
        
        const stocks = await Stock.find(query)
            .sort({ date: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await Stock.countDocuments(query);
        
        // ✅ Calculer les totaux correctement
        let totalStock = 0;
        let totalEntrees = 0;
        let totalSorties = 0;
        const allStocks = await Stock.find().sort({ date: 1, _id: 1 });
        
        for (const s of allStocks) {
            // Support des deux formats (ancien et nouveau)
            let montantValue = 0;
            let isEntree = false;
            
            if (s.type === 'entree') {
                montantValue = s.montant;
                isEntree = true;
            } else if (s.type === 'sortie') {
                montantValue = s.montant;
                isEntree = false;
            } else if (s.entre > 0) {
                montantValue = s.entre;
                isEntree = true;
            } else if (s.sortie > 0) {
                montantValue = s.sortie;
                isEntree = false;
            }
            
            if (isEntree) {
                totalStock += montantValue;
                totalEntrees += montantValue;
            } else {
                totalStock -= montantValue;
                totalSorties += montantValue;
            }
        }
        
        // ✅ Formater les stocks pour le frontend
        const formattedStocks = stocks.map(s => {
            let entre = 0;
            let sortie = 0;
            let total = s.montantTotal || s.total || 0;
            
            if (s.type === 'entree') {
                entre = s.montant;
            } else if (s.type === 'sortie') {
                sortie = s.montant;
            } else if (s.entre > 0) {
                entre = s.entre;
                total = s.total;
            } else if (s.sortie > 0) {
                sortie = s.sortie;
                total = s.total;
            }
            
            return {
                _id: s._id,
                date: s.date,
                lieu: s.lieu,
                detail: s.detail,
                entre: entre,
                sortie: sortie,
                total: total,
                quantite: s.quantite || 1,
                prixUnitaire: s.prixUnitaire || 0,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            };
        });
        
        console.log(`📊 ${formattedStocks.length} stocks retournés`);
        
        res.status(200).json({
            success: true,
            data: {
                stocks: formattedStocks,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                stats: {
                    totalStock: totalStock,
                    totalEntrees: totalEntrees,
                    totalSorties: totalSorties,
                    totalMouvements: total,
                    dernierTotal: totalStock
                }
            }
        });
    } catch (error) {
        console.error("❌ Erreur getStocks:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== RÉCUPÉRER UN STOCK PAR ID ====================
exports.getStockById = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id);
        if (!stock) {
            return res.status(404).json({ success: false, message: 'Stock non trouvé' });
        }
        
        let entre = 0;
        let sortie = 0;
        let total = stock.montantTotal || stock.total || 0;
        
        if (stock.type === 'entree') {
            entre = stock.montant;
        } else if (stock.type === 'sortie') {
            sortie = stock.montant;
        } else if (stock.entre > 0) {
            entre = stock.entre;
            total = stock.total;
        } else if (stock.sortie > 0) {
            sortie = stock.sortie;
            total = stock.total;
        }
        
        res.status(200).json({
            success: true,
            data: {
                stock: {
                    _id: stock._id,
                    date: stock.date,
                    lieu: stock.lieu,
                    detail: stock.detail,
                    entre: entre,
                    sortie: sortie,
                    total: total,
                    quantite: stock.quantite || 1,
                    prixUnitaire: stock.prixUnitaire || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== MODIFIER UN STOCK ====================
exports.updateStock = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id);
        if (!stock) {
            return res.status(404).json({ success: false, message: 'Stock non trouvé' });
        }
        
        const { date, lieu, detail, type, montant, quantite, prixUnitaire } = req.body;
        
        if (date) stock.date = date;
        if (lieu) stock.lieu = lieu;
        if (detail) stock.detail = detail;
        if (type && ['entree', 'sortie'].includes(type)) stock.type = type;
        if (montant) stock.montant = montant;
        if (quantite) stock.quantite = quantite;
        if (prixUnitaire) stock.prixUnitaire = prixUnitaire;
        
        await stock.save();
        
        // Recalculer tous les totaux
        const allStocks = await Stock.find().sort({ date: 1, _id: 1 });
        let cumulMontant = 0;
        
        for (const s of allStocks) {
            if (s.type === 'entree') {
                cumulMontant += s.montant;
            } else if (s.type === 'sortie') {
                cumulMontant -= s.montant;
            } else if (s.entre > 0) {
                cumulMontant += s.entre;
            } else if (s.sortie > 0) {
                cumulMontant -= s.sortie;
            }
            s.montantTotal = cumulMontant;
            await s.save();
        }
        
        res.status(200).json({
            success: true,
            message: 'Mouvement modifié avec succès!',
            data: {
                stock: {
                    _id: stock._id,
                    date: stock.date,
                    lieu: stock.lieu,
                    detail: stock.detail,
                    entre: stock.type === 'entree' ? stock.montant : 0,
                    sortie: stock.type === 'sortie' ? stock.montant : 0,
                    total: stock.montantTotal
                }
            }
        });
    } catch (error) {
        console.error("❌ Erreur updateStock:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== SUPPRIMER UN STOCK (avec archivage) ====================
exports.deleteStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const stock = await Stock.findById(req.params.id).session(session);
        if (!stock) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Stock non trouvé' });
        }

        // ✅ 1. Archiver le stock avant suppression
        const archive = new Archive({
            type: 'stock',
            data: [stock],
            montantTotal: stock.montant || stock.entre || 0,
            archivePar: req.user?.nomComplet || 'Suppression manuelle'
        });
        await archive.save({ session });

        // ✅ 2. Supprimer le stock
        await Stock.findByIdAndDelete(req.params.id).session(session);

        // ✅ 3. Recalculer les totaux après suppression
        const allStocks = await Stock.find().sort({ date: 1, _id: 1 }).session(session);
        let cumulMontant = 0;
        for (const s of allStocks) {
            if (s.type === 'entree') cumulMontant += s.montant;
            else if (s.type === 'sortie') cumulMontant -= s.montant;
            s.montantTotal = cumulMontant;
            await s.save({ session });
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Stock supprimé et archivé avec succès',
            archiveId: archive._id
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Erreur deleteStock:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== STATISTIQUES ====================
exports.getStockStats = async (req, res) => {
    console.log("🔥🔥🔥 getStockStats est appelée ! 🔥🔥🔥");
    try {
        const allStocks = await Stock.find({});
        console.log(`📊 Nombre de stocks trouvés: ${allStocks.length}`);
        // ... reste du code
    } catch (error) {
        console.error("❌ Erreur getStockStats:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== LIEUX DISPONIBLES ====================
exports.getLieux = async (req, res) => {
    try {
        const lieuxDistincts = await Stock.distinct('lieu');
        const lieux = lieuxDistincts.map(lieu => ({
            value: lieu,
            label: lieu
        }));
        
        if (lieux.length === 0) {
            const defaultLieux = [
                { value: 'Bonfi Station', label: '⛽ Bonfi Station' },
                { value: 'Bonfi Eglise', label: '⛪ Bonfi Eglise' },
                { value: 'Tannerie', label: '🏭 Tannerie' },
                { value: 'Partenaire', label: '🤝 Partenaire' },
                { value: 'Client Matelas', label: '🛏️ Client Matelas' },
                { value: 'Client Auto', label: '🚗 Client Auto' },
                { value: 'Client', label: '👤 Client' }
            ];
            return res.status(200).json({ success: true, data: defaultLieux });
        }
        
        res.status(200).json({ success: true, data: lieux });
    } catch (error) {
        console.error("❌ Erreur getLieux:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ARCHIVER ET VIDER LES STOCKS ====================
exports.archiverEtViderStocks = async (req, res) => {
    try {
        const stocks = await Stock.find({});
        if (stocks.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun stock à archiver'
            });
        }
        
        const montantTotal = stocks.reduce((sum, s) => sum + (s.montant || s.entre || s.sortie || 0), 0);
        
        const archive = new Archive({
            type: 'stock',
            data: stocks,
            montantTotal: montantTotal,
            archivePar: req.user?.nomComplet || 'Caisse'
        });
        
        await archive.save();
        await Stock.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: `${stocks.length} mouvements de stock archivés avec succès`
        });
    } catch (error) {
        console.error("❌ Erreur archiverEtViderStocks:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== ARCHIVES ====================
exports.getArchives = async (req, res) => {
    try {
        const archives = await Archive.find().sort({ dateArchivage: -1 });
        res.status(200).json({ success: true, data: archives });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getArchiveById = async (req, res) => {
    try {
        const archive = await Archive.findById(req.params.id);
        if (!archive) {
            return res.status(404).json({ success: false, message: 'Archive non trouvée' });
        }
        res.status(200).json({ success: true, data: archive });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteArchive = async (req, res) => {
    try {
        const archive = await Archive.findByIdAndDelete(req.params.id);
        if (!archive) {
            return res.status(404).json({ success: false, message: 'Archive non trouvée' });
        }
        res.status(200).json({ success: true, message: 'Archive supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};