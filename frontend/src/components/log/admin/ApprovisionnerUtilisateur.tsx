// components/admin/ApprovisionnerUtilisateur.jsx
import React, { useState, useEffect } from 'react';
import { 
  Package, Users, DollarSign, AlertCircle, CheckCircle, 
  Search, User, ShoppingCart, Plus, X, XCircle, 
  Trash2, Edit2, Filter, ChevronDown, ChevronUp, 
  Calendar, RefreshCw, Clock
} from 'lucide-react';
import api from '../../../config/axiosConfig';

// 🔹 Notification Élégante Premium
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getConfig = () => {
    switch(type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-emerald-500 to-green-600",
          icon: <CheckCircle size={24} className="text-white" />,
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-amber-500 to-orange-600",
          icon: <AlertCircle size={24} className="text-white" />,
        };
      default:
        return {
          bg: "bg-gradient-to-r from-red-500 to-rose-600",
          icon: <XCircle size={24} className="text-white" />,
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`${config.bg} text-white rounded-2xl shadow-2xl max-w-md transform transition-all duration-300`}>
        <div className="flex items-start p-4 gap-3">
          <div className="flex-shrink-0 bg-white/20 rounded-xl p-2 backdrop-blur-sm">
            {config.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              {type === "success" ? "Succès" : type === "warning" ? "Attention" : "Erreur"}
            </h4>
            <p className="text-white/90 text-sm mt-1">{message}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="h-1 bg-white/20 rounded-full mx-4 mb-2 overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

const ApprovisionnerUtilisateur = () => {
  const [produits, setProduits] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState('');
  const [selectedUtilisateur, setSelectedUtilisateur] = useState('');
  const [quantite, setQuantite] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [prixVente, setPrixVente] = useState('');
  const [stockMin, setStockMin] = useState('5');
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [historique, setHistorique] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);

  // ✅ NOUVEAUX ÉTATS POUR LA GESTION DES APPROVISIONNEMENTS
  const [approvisionnements, setApprovisionnements] = useState([]);
  const [filteredApprovisionnements, setFilteredApprovisionnements] = useState([]);
  const [loadingApprovisionnements, setLoadingApprovisionnements] = useState(false);
  const [showApprovisionnements, setShowApprovisionnements] = useState(false);
  const [searchApprovisionnement, setSearchApprovisionnement] = useState('');
  const [filterStatutApprovisionnement, setFilterStatutApprovisionnement] = useState('all');
  const [selectedApprovisionnement, setSelectedApprovisionnement] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    quantite: '',
    prixAchat: '',
    prixVente: '',
    stockMin: '',
    dateExpiration: ''
  });

  // ✅ État de la notification élégante
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  useEffect(() => {
    fetchProduits();
    fetchUtilisateurs();
    fetchHistorique();
    fetchAllApprovisionnements();
  }, []);

  // ✅ Récupération des produits – compatible avec `data` ou `produit`
  const fetchProduits = async () => {
    try {
      const res = await api.get('/api/allroute/getAllProduit');
      const produitsData = res.data.data || res.data.produit || [];
      setProduits(produitsData);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  // ✅ Récupération des utilisateurs – compatible avec `data` ou `utilisateur`
  const fetchUtilisateurs = async () => {
    try {
      const res = await api.get('/api/utilisateur/getAllUtilisateurs');
      const utilisateursData = res.data.data || res.data.utilisateur || [];
      setUtilisateurs(utilisateursData);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  // ✅ Récupération de l'historique – compatible avec `data` ou `approvisionnements`
  const fetchHistorique = async () => {
    try {
      const res = await api.get('/api/utilisateur/approvisionnements');
      const historiqueData = res.data.data || res.data.approvisionnements || [];
      setHistorique(historiqueData);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  // ✅ NOUVEAU : Récupérer tous les approvisionnements avec détails
  const fetchAllApprovisionnements = async () => {
    setLoadingApprovisionnements(true);
    try {
      const res = await api.get('/api/utilisateur/approvisionnements-all');
      const data = res.data.approvisionnements || [];
      setApprovisionnements(data);
      setFilteredApprovisionnements(data);
    } catch (error) {
      console.error('Erreur chargement approvisionnements:', error);
      showNotification('error', 'Erreur lors du chargement des approvisionnements');
    } finally {
      setLoadingApprovisionnements(false);
    }
  };

  // ✅ Filtrage des approvisionnements
  useEffect(() => {
    let results = approvisionnements;
    if (searchApprovisionnement) {
      const term = searchApprovisionnement.toLowerCase();
      results = results.filter(a => 
        a.utilisateur?.nomComplet?.toLowerCase().includes(term) ||
        a.produit?.categorieNom?.toLowerCase().includes(term) ||
        a.produitNom?.toLowerCase().includes(term) ||
        a.utilisateurNom?.toLowerCase().includes(term)
      );
    }
    if (filterStatutApprovisionnement !== 'all') {
      results = results.filter(a => a.statut === filterStatutApprovisionnement);
    }
    setFilteredApprovisionnements(results);
  }, [searchApprovisionnement, filterStatutApprovisionnement, approvisionnements]);

  // ✅ NOUVEAU : Ouvrir le modal de modification
  const openEditModal = (approv) => {
    setSelectedApprovisionnement(approv);
    setEditForm({
      quantite: approv.quantite || '',
      prixAchat: approv.prixAchat || '',
      prixVente: approv.prixVente || '',
      stockMin: approv.stockMin || '5',
      dateExpiration: approv.dateExpiration ? approv.dateExpiration.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // ✅ NOUVEAU : Modifier un approvisionnement
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/api/utilisateur/approvisionnement/${selectedApprovisionnement._id}`, {
        quantite: parseInt(editForm.quantite),
        prixAchat: parseFloat(editForm.prixAchat),
        prixVente: parseFloat(editForm.prixVente),
        stockMin: parseInt(editForm.stockMin) || 5,
        dateExpiration: editForm.dateExpiration || null
      });
      showNotification('success', res.data.message);
      setShowEditModal(false);
      fetchAllApprovisionnements();
      fetchHistorique();
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  // ✅ NOUVEAU : Supprimer un approvisionnement
  const handleDeleteApprovisionnement = async (id) => {
    const approv = approvisionnements.find(a => a._id === id);
    if (!window.confirm(`⚠️ Supprimer définitivement l'approvisionnement de ${approv?.quantite} ${approv?.produitNom || 'produit'} pour ${approv?.utilisateurNom} ?`)) return;
    try {
      const res = await api.delete(`/api/utilisateur/approvisionnement/${id}`);
      showNotification('success', res.data.message);
      fetchAllApprovisionnements();
      fetchHistorique();
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/utilisateur/approvisionner', {
        produitId: selectedProduit,
        utilisateurId: selectedUtilisateur,
        quantite: parseInt(quantite),
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        stockMin: parseInt(stockMin)
      });

      showNotification('success', response.data.message || 'Approvisionnement réussi !');

      setSelectedProduit('');
      setSelectedUtilisateur('');
      setQuantite('');
      setPrixAchat('');
      setPrixVente('');
      
      fetchHistorique();
      fetchAllApprovisionnements();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'approvisionnement';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProduitSelect = (produitId) => {
    const produit = produits.find(p => p._id === produitId);
    setSelectedProduit(produitId);
    if (produit) {
      setPrixAchat(produit.prixAchat);
      setPrixVente(produit.prixVente);
      setStockMin(produit.stock_min || '5');
    }
  };

  const filteredUtilisateurs = utilisateurs.filter(user => 
    user.nomComplet?.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredProduits = produits.filter(prod => 
    prod.categorieNom?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  // ✅ Statistiques des approvisionnements
  const statsApprovisionnements = {
    total: approvisionnements.length,
    actifs: approvisionnements.filter(a => a.statut === 'actif').length,
    epuises: approvisionnements.filter(a => a.statut === 'epuise').length,
    expires: approvisionnements.filter(a => a.statut === 'expire').length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ✅ Notification élégante */}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: '', message: '' })}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire d'approvisionnement (INCHANGÉ) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="text-blue-600" />
              Approvisionner un utilisateur
            </h2>
            <p className="text-gray-500 mt-1">Choisissez un utilisateur et un produit à lui attribuer</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Sélection utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Utilisateur *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl mb-2"
                />
              </div>
              <select
                value={selectedUtilisateur}
                onChange={(e) => setSelectedUtilisateur(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
                size={5}
              >
                <option value="">-- Sélectionner un utilisateur --</option>
                {filteredUtilisateurs.map(user => (
                  <option key={user._id} value={user._id}>
                    👤 {user.nomComplet} - {user.role} {!user.actif && '(inactif)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection produit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produit *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl mb-2"
                />
              </div>
              <select
                value={selectedProduit}
                onChange={(e) => handleProduitSelect(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
                size={5}
              >
                <option value="">-- Sélectionner un produit --</option>
                {filteredProduits.map(prod => (
                  <option key={prod._id} value={prod._id}>
                    📦 {prod.categorieNom} - Stock: {prod.quantite}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité *</label>
                <input
                  type="number"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  placeholder="Quantité"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock minimum</label>
                <input
                  type="number"
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  placeholder="Stock min"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix d'achat (GNF) *</label>
                <input
                  type="number"
                  value={prixAchat}
                  onChange={(e) => setPrixAchat(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  placeholder="Prix d'achat"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix de vente (GNF) *</label>
                <input
                  type="number"
                  value={prixVente}
                  onChange={(e) => setPrixVente(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  placeholder="Prix de vente"
                  min="0"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedUtilisateur || !selectedProduit || !quantite}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {loading ? 'Approvisionnement en cours...' : 'Approvisionner l\'utilisateur'}
            </button>
          </form>
        </div>

        {/* Résumé et infos */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">📦 Approvisionnement</h3>
            <p className="text-blue-100 mb-4">
              Cette action permet d'attribuer un stock de produits à un utilisateur spécifique.
              L'utilisateur pourra ensuite vendre ces produits et voir son stock personnel.
            </p>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm">💡 Chaque utilisateur peut voir :</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>✓ Son stock personnel restant</li>
                <li>✓ Le montant total vendu par produit</li>
                <li>✓ Son chiffre d'affaires</li>
              </ul>
            </div>
          </div>

          {/* Historique (INCHANGÉ) */}
          <button
            onClick={() => setShowHistorique(!showHistorique)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
          >
            <span className="font-semibold flex items-center gap-2">
              <Clock size={20} />
              Historique des approvisionnements
            </span>
            <span>{showHistorique ? '▲' : '▼'}</span>
          </button>

          {showHistorique && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {historique.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucun historique d'approvisionnement
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Qté</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historique.slice(0, 10).map((h) => (
                        <tr key={h._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{new Date(h.dateApprovisionnement).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">{h.utilisateurNom}</td>
                          <td className="px-4 py-3 text-sm">{h.produitNom}</td>
                          <td className="px-4 py-3 text-sm">{h.quantite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ✅ NOUVEAU : GESTION DES APPROVISIONNEMENTS (MODIFICATION + SUPPRESSION) */}
          <button
            onClick={() => {
              setShowApprovisionnements(!showApprovisionnements);
              if (!showApprovisionnements) fetchAllApprovisionnements();
            }}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:bg-green-100 transition border border-green-200"
          >
            <span className="font-semibold flex items-center gap-2">
              <Package className="text-green-600" size={20} />
              Gestion des approvisionnements
              <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">
                {approvisionnements.length}
              </span>
            </span>
            <span>{showApprovisionnements ? '▲' : '▼'}</span>
          </button>

          {showApprovisionnements && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Filtres */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Rechercher utilisateur/produit..."
                      value={searchApprovisionnement}
                      onChange={(e) => setSearchApprovisionnement(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm w-full"
                    />
                  </div>
                  <select
                    value={filterStatutApprovisionnement}
                    onChange={(e) => setFilterStatutApprovisionnement(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="actif">✅ Actif</option>
                    <option value="epuise">⚠️ Épuisé</option>
                    <option value="expire">📅 Expiré</option>
                  </select>
                  <button
                    onClick={fetchAllApprovisionnements}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm"
                  >
                    <RefreshCw size={16} className={loadingApprovisionnements ? 'animate-spin' : ''} />
                    Actualiser
                  </button>
                </div>
                {/* Statistiques rapides */}
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-gray-600">Total: <strong className="text-gray-900">{statsApprovisionnements.total}</strong></span>
                  <span className="text-green-600">Actifs: <strong>{statsApprovisionnements.actifs}</strong></span>
                  <span className="text-amber-600">Épuisés: <strong>{statsApprovisionnements.epuises}</strong></span>
                  <span className="text-red-600">Expirés: <strong>{statsApprovisionnements.expires}</strong></span>
                </div>
              </div>

              {/* Liste des approvisionnements */}
              <div className="max-h-80 overflow-y-auto">
                {loadingApprovisionnements ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                    <p className="text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : filteredApprovisionnements.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package size={40} className="mx-auto text-gray-300 mb-2" />
                    Aucun approvisionnement trouvé
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qté</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Restant</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Statut</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredApprovisionnements.map((app) => (
                        <tr key={app._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs">
                            {new Date(app.dateApprovisionnement || app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium">
                            {app.utilisateur?.nomComplet || app.utilisateurNom || 'Inconnu'}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {app.produit?.categorieNom || app.produitNom || 'Inconnu'}
                          </td>
                          <td className="px-3 py-2 text-center text-sm">{app.quantite}</td>
                          <td className="px-3 py-2 text-center text-sm font-semibold">
                            <span className={app.stockRestant <= 0 ? 'text-red-600' : 'text-green-600'}>
                              {app.stockRestant}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              app.statut === 'actif' ? 'bg-green-100 text-green-700' :
                              app.statut === 'epuise' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {app.statut === 'actif' ? '✅ Actif' :
                               app.statut === 'epuise' ? '⚠️ Épuisé' : '📅 Expiré'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => openEditModal(app)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteApprovisionnement(app._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL DE MODIFICATION */}
      {showEditModal && selectedApprovisionnement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="text-blue-600" size={24} />
                Modifier l'approvisionnement
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit : <span className="font-semibold">{selectedApprovisionnement.produitNom || 'Inconnu'}</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur : <span className="font-semibold">{selectedApprovisionnement.utilisateur?.nomComplet || selectedApprovisionnement.utilisateurNom || 'Inconnu'}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                <input
                  type="number"
                  value={editForm.quantite}
                  onChange={(e) => setEditForm(prev => ({ ...prev, quantite: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat (GNF)</label>
                  <input
                    type="number"
                    value={editForm.prixAchat}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prixAchat: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (GNF)</label>
                  <input
                    type="number"
                    value={editForm.prixVente}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prixVente: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock minimum</label>
                  <input
                    type="number"
                    value={editForm.stockMin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stockMin: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    value={editForm.dateExpiration}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dateExpiration: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-md"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-progress-bar { animation: progressBar 3.8s linear forwards; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default ApprovisionnerUtilisateur;