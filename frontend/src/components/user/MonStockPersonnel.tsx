import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, DollarSign, ShoppingCart, AlertCircle, 
  CheckCircle, Search, X, Clock, Banknote, Calendar, MapPin, 
  FileText, PlusCircle, MinusCircle 
} from 'lucide-react';
import api from '../../config/axiosConfig';

// ==================== INTERFACES ====================
interface Stock {
  _id: string;
  produitNom: string;
  prixVente: number;
  prixAchat: number;
  stockRestant: number;
  stockMin: number;
  autoriserModificationPrixVente: boolean;
}

interface Stats {
  totalProduits: number;
  valeurTotaleStock: number;
  produitsUniques: number;
}

interface Vente {
  _id: string;
  dateVente: string;
  produitNom: string;
  quantite: number;
  prixVente: number;
  montantTotal: number;
  modePaiement: 'comptant' | 'partiel' | 'credit';
  montantPaye: number;
  resteAPayer: number;
  clientNom: string | null;
  statut: 'active' | 'annulee' | 'remboursee' | 'depot_attente' | 'depot_valide';
}

interface VenteParProduit {
  produitNom: string;
  quantiteTotale: number;
  montantTotal: number;
  nombreVentes: number;
}

interface Message {
  type: 'success' | 'error' | 'info' | '';
  text: string;
}

interface VenteData {
  approvisionnementId: string;
  quantite: string;
  prixVente: number;
  clientNom: string;
  modePaiement: 'comptant' | 'partiel' | 'credit';
  montantPaye: number;
  resteAPayer: number;
}

// ==================== COMPOSANT ====================
const MonStockPersonnel: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [venteData, setVenteData] = useState<VenteData>({
    approvisionnementId: '',
    quantite: '',
    prixVente: 0,
    clientNom: '',
    modePaiement: 'comptant',
    montantPaye: 0,
    resteAPayer: 0
  });
  const [showVenteModal, setShowVenteModal] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  const [stats, setStats] = useState<Stats>({ totalProduits: 0, valeurTotaleStock: 0, produitsUniques: 0 });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mesVentes, setMesVentes] = useState<Vente[]>([]);
  const [showVentes, setShowVentes] = useState<boolean>(false);
  const [ventesParProduit, setVentesParProduit] = useState<VenteParProduit[]>([]);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // ✅ NOUVEAUX ÉTATS POUR DEMANDE DE CAISSE
  const [showDemandeModal, setShowDemandeModal] = useState<boolean>(false);
  const [soldeCaisse, setSoldeCaisse] = useState<number>(0);
  const [demandeForm, setDemandeForm] = useState({
    type: 'entree' as 'entree' | 'sortie',
    montantEntree: 0,
    montantSortie: 0,
    lieu: '',
    detail: '',
    quantite: 1,
    prixUnitaire: 0
  });
  const [loadingDemande, setLoadingDemande] = useState<boolean>(false);
  const [lieuxDisponibles, setLieuxDisponibles] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchMonStock();
    fetchMesVentes();
    fetchSoldeCaisse();
    fetchLieux();
  }, []);

  const fetchMonStock = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get('/api/allroute/mon-stock');
      const stocksData = res.data.stocks || [];
      
      const stocksAvecAutorisation = stocksData.map(s => ({
        ...s,
        autoriserModificationPrixVente: s.autoriserModificationPrixVente || false
      }));

      setStocks(stocksAvecAutorisation);
      setStats({
        totalProduits: res.data.totalProduits || 0,
        valeurTotaleStock: res.data.valeurTotaleStock || 0,
        produitsUniques: res.data.produitsUniques || 0
      });
    } catch (error) {
      console.error('Erreur chargement stock:', error);
      showMessage('error', 'Impossible de charger votre stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchMesVentes = async (): Promise<void> => {
    try {
      const res = await api.get('/api/allroute/mes-ventes');
      setMesVentes(res.data.ventes || []);
      setVentesParProduit(res.data.ventesParProduit || []);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    }
  };

  // ✅ Récupérer le solde de caisse (Fluidité)
  const fetchSoldeCaisse = async (): Promise<void> => {
    try {
      // Utiliser l'endpoint qui retourne les stats de stock (dernierTotal)
      const res = await api.get('/api/allroute/stocks?limit=1');
      if (res.data.success && res.data.data?.stats?.dernierTotal !== undefined) {
        setSoldeCaisse(res.data.data.stats.dernierTotal);
      } else {
        setSoldeCaisse(0);
      }
    } catch (error) {
      console.error('Erreur récupération solde caisse:', error);
      setSoldeCaisse(0);
    }
  };

  // ✅ Récupérer les lieux disponibles
  const fetchLieux = async (): Promise<void> => {
    try {
      const res = await api.get('/api/allroute/lieux');
      if (res.data.success && res.data.data.length > 0) {
        setLieuxDisponibles(res.data.data);
      } else {
        // Valeurs par défaut si aucun lieu
        setLieuxDisponibles([
          { value: 'Bonfi Station', label: '⛽ Bonfi Station' },
          { value: 'Bonfi Eglise', label: '⛪ Bonfi Eglise' },
          { value: 'Tannerie', label: '🏭 Tannerie' },
          { value: 'Partenaire', label: '🤝 Partenaire' },
          { value: 'Client Matelas', label: '🛏️ Client Matelas' },
          { value: 'Client Auto', label: '🚗 Client Auto' },
          { value: 'Client', label: '👤 Client' }
        ]);
      }
    } catch (error) {
      console.error('Erreur récupération lieux:', error);
      setLieuxDisponibles([
        { value: 'Bonfi Station', label: '⛽ Bonfi Station' },
        { value: 'Bonfi Eglise', label: '⛪ Bonfi Eglise' },
        { value: 'Tannerie', label: '🏭 Tannerie' },
        { value: 'Partenaire', label: '🤝 Partenaire' },
        { value: 'Client Matelas', label: '🛏️ Client Matelas' },
        { value: 'Client Auto', label: '🚗 Client Auto' },
        { value: 'Client', label: '👤 Client' }
      ]);
    }
  };

  const showMessage = (type: Message['type'], text: string): void => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const getMontantTotal = (): number => {
    const quantite = parseInt(venteData.quantite) || 0;
    return quantite * (venteData.prixVente || 0);
  };

  const handleModePaiementChange = (mode: VenteData['modePaiement']): void => {
    const total = getMontantTotal();
    let nouveauMontantPaye = 0;
    let nouveauReste = 0;
    if (mode === 'comptant') {
      nouveauMontantPaye = total;
      nouveauReste = 0;
    } else if (mode === 'credit') {
      nouveauMontantPaye = 0;
      nouveauReste = total;
    } else if (mode === 'partiel') {
      nouveauMontantPaye = Math.min(venteData.montantPaye || 0, total);
      nouveauReste = total - nouveauMontantPaye;
    }
    setVenteData({
      ...venteData,
      modePaiement: mode,
      montantPaye: nouveauMontantPaye,
      resteAPayer: nouveauReste
    });
  };

  const handleMontantPayeChange = (value: string): void => {
    const total = getMontantTotal();
    let paye = parseFloat(value) || 0;
    paye = Math.min(paye, total);
    setVenteData({
      ...venteData,
      montantPaye: paye,
      resteAPayer: total - paye
    });
  };

  const handleVente = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const response = await api.post('/api/allroute/enregistrer-vente', {
        approvisionnementId: venteData.approvisionnementId,
        quantite: parseInt(venteData.quantite),
        prix_unitaire: venteData.prixVente,
        clientNom: venteData.clientNom || null,
        modePaiement: venteData.modePaiement,
        montantPaye: venteData.montantPaye,
        resteAPayer: venteData.resteAPayer
      });
      showMessage('success', response.data.message);
      setShowVenteModal(false);
      setVenteData({
        approvisionnementId: '',
        quantite: '',
        prixVente: 0,
        clientNom: '',
        modePaiement: 'comptant',
        montantPaye: 0,
        resteAPayer: 0
      });
      setSelectedStock(null);
      await fetchMonStock();
      await fetchMesVentes();
      window.dispatchEvent(new CustomEvent('refreshVentes'));
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showMessage('error', err.response?.data?.message || 'Erreur lors de la vente');
    } finally {
      setLoadingAction(false);
    }
  };

  const demanderDepotCaisse = async (vente: Vente): Promise<void> => {
    if (vente.statut !== 'active') {
      showMessage('info', `Cette vente est déjà ${vente.statut === 'depot_attente' ? 'en attente de validation' : 'déposée'}`);
      return;
    }
    if (!window.confirm(`📤 Demander le dépôt de ${formatGNF(vente.montantTotal)} pour ${vente.quantite} ${vente.produitNom} ?\n\nL'administrateur devra valider cette demande.`)) {
      return;
    }
    setLoadingAction(true);
    try {
      const response = await api.post(`/api/allroute/demander-depot/${vente._id}`);
      showMessage('success', response.data.message);
      await fetchMesVentes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showMessage('error', err.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setLoadingAction(false);
    }
  };

  const annulerVente = async (vente: Vente): Promise<void> => {
    if (vente.statut !== 'active') {
      showMessage('info', 'Seules les ventes actives peuvent être annulées');
      return;
    }
    if (!window.confirm(`⚠️ Annuler la vente de ${vente.quantite} ${vente.produitNom} ?\n\nCette action est irréversible et supprimera cette vente de l'historique.`)) {
      return;
    }
    setLoadingAction(true);
    try {
      const response = await api.delete(`/api/allroute/annuler-vente/${vente._id}`);
      showMessage('success', response.data.message);
      await fetchMonStock();
      await fetchMesVentes();
      window.dispatchEvent(new CustomEvent('refreshVentes'));
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showMessage('error', err.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setLoadingAction(false);
    }
  };

  const reglerReste = async (vente: Vente): Promise<void> => {
    if (vente.resteAPayer <= 0) {
      showMessage('info', 'Cette vente est déjà entièrement payée');
      return;
    }
    const montant = window.prompt(`💰 Montant à payer pour "${vente.produitNom}"\nReste dû : ${formatGNF(vente.resteAPayer)}\n\nMontant à payer (GNF) :`, vente.resteAPayer);
    if (!montant) return;
    const montantPaye = parseFloat(montant);
    if (isNaN(montantPaye) || montantPaye <= 0) {
      showMessage('error', 'Montant invalide');
      return;
    }
    if (montantPaye > vente.resteAPayer) {
      showMessage('error', `Le montant ne peut pas dépasser ${formatGNF(vente.resteAPayer)}`);
      return;
    }
    setLoadingAction(true);
    try {
      const response = await api.post(`/api/allroute/regler-reste/${vente._id}`, { montantPaye });
      showMessage('success', response.data.message);
      await fetchMesVentes();
      await fetchMonStock();
      window.dispatchEvent(new CustomEvent('refreshVentes'));
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showMessage('error', err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoadingAction(false);
    }
  };

  // ✅ NOUVELLE FONCTION : soumettre une demande de caisse (adaptée)
  const handleSubmitDemande = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Déterminer le type et le montant
    let type: 'entree' | 'sortie' = 'entree';
    let montant = 0;
    
    if (demandeForm.montantEntree > 0 && demandeForm.montantSortie === 0) {
      type = 'entree';
      montant = demandeForm.montantEntree;
    } else if (demandeForm.montantSortie > 0 && demandeForm.montantEntree === 0) {
      type = 'sortie';
      montant = demandeForm.montantSortie;
    } else {
      showMessage('error', 'Veuillez saisir un montant pour l\'entrée OU pour la sortie (pas les deux)');
      return;
    }

    if (montant <= 0) {
      showMessage('error', 'Le montant doit être supérieur à 0');
      return;
    }

    if (!demandeForm.lieu) {
      showMessage('error', 'Veuillez sélectionner un lieu');
      return;
    }

    if (!demandeForm.detail.trim()) {
      showMessage('error', 'Veuillez saisir un détail');
      return;
    }

    setLoadingDemande(true);
    try {
      const payload = {
        type: type,
        montant: montant,
        lieu: demandeForm.lieu,
        detail: demandeForm.detail,
        quantite: demandeForm.quantite || 1,
        prixUnitaire: demandeForm.prixUnitaire || montant
      };
      const res = await api.post('/api/allroute/demandes-caisse', payload);
      showMessage('success', res.data.message);
      setShowDemandeModal(false);
      // Réinitialiser le formulaire
      setDemandeForm({
        type: 'entree',
        montantEntree: 0,
        montantSortie: 0,
        lieu: '',
        detail: '',
        quantite: 1,
        prixUnitaire: 0
      });
      // Rafraîchir le solde
      await fetchSoldeCaisse();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoadingDemande(false);
    }
  };

  const openVenteModal = (approvisionnement: Stock): void => {
    setSelectedStock(approvisionnement);
    setVenteData({
      approvisionnementId: approvisionnement._id,
      quantite: '',
      prixVente: approvisionnement.prixVente,
      clientNom: '',
      modePaiement: 'comptant',
      montantPaye: 0,
      resteAPayer: 0
    });
    setShowVenteModal(true);
  };

  const handleQuantiteChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newQuantite = e.target.value;
    const total = (parseInt(newQuantite) || 0) * (venteData.prixVente || 0);
    if (venteData.modePaiement === 'comptant') {
      setVenteData(prev => ({ ...prev, quantite: newQuantite, montantPaye: total, resteAPayer: 0 }));
    } else if (venteData.modePaiement === 'credit') {
      setVenteData(prev => ({ ...prev, quantite: newQuantite, montantPaye: 0, resteAPayer: total }));
    } else if (venteData.modePaiement === 'partiel') {
      const paye = Math.min(venteData.montantPaye || 0, total);
      setVenteData(prev => ({ ...prev, quantite: newQuantite, montantPaye: paye, resteAPayer: total - paye }));
    }
  };

  const filteredStocks = stocks.filter(stock =>
    stock.produitNom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatGNF = (amount: number): string => {
    if (!amount && amount !== 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
  };

  const getStatutBadge = (statut: Vente['statut']): JSX.Element => {
    switch (statut) {
      case 'active': return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">✅ Active</span>;
      case 'depot_attente': return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={12} /> En attente</span>;
      case 'depot_valide': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">💰 Déposée</span>;
      case 'annulee': return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">❌ Annulée</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">✅ Active</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {message.text && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl flex items-center gap-2 shadow-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="ml-4"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Carte 1 : Produits en stock */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Produits en stock</p>
              <p className="text-3xl font-bold">{stats.totalProduits}</p>
              <p className="text-blue-100 text-xs mt-1">{stats.produitsUniques} produits différents</p>
            </div>
            <Package size={40} className="text-blue-200" />
          </div>
        </div>

        {/* Carte 2 : Valeur totale du stock */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Valeur totale du stock</p>
              <p className="text-2xl font-bold">{formatGNF(stats.valeurTotaleStock)}</p>
            </div>
            <DollarSign size={40} className="text-green-200" />
          </div>
        </div>

        {/* Carte 3 : Mes ventes (existant) */}
        <button
          onClick={() => setShowVentes(!showVentes)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white text-left hover:from-purple-600 hover:to-purple-700 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Mes ventes</p>
              <p className="text-3xl font-bold">{mesVentes.length}</p>
              <p className="text-purple-100 text-xs mt-1">Cliquez pour voir les détails</p>
            </div>
            <TrendingUp size={40} className="text-purple-200" />
          </div>
        </button>

        {/* ✅ NOUVEAU : Bouton pour demander un mouvement de caisse */}
        <button
          onClick={() => setShowDemandeModal(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white text-left hover:from-yellow-600 hover:to-orange-600 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Demander un mouvement</p>
              <p className="text-2xl font-bold">Fluidité du cach</p>
              <p className="text-yellow-100 text-xs mt-1">Entrée / Sortie</p>
            </div>
            <Banknote size={40} className="text-yellow-200" />
          </div>
        </button>
      </div>

      {showVentes && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-purple-600" />
              Historique de mes ventes
            </h3>
          </div>
          
          {ventesParProduit.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-3">Résumé par produit :</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ventesParProduit.map((prod, idx) => {
                  const ventesActives = mesVentes.filter(v => v.produitNom === prod.produitNom && v.statut === 'active');
                  const aDesVentesActives = ventesActives.length > 0;
                  return (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4">
                      <p className="font-semibold text-gray-800">{prod.produitNom}</p>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-gray-600">Quantité vendue:</span>
                        <span className="font-medium">{prod.quantiteTotale}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Montant total:</span>
                        <span className="font-medium text-green-600">{formatGNF(prod.montantTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Nombre de ventes:</span>
                        <span className="font-medium">{prod.nombreVentes}</span>
                      </div>
                      {aDesVentesActives && (
                        <button
                          onClick={() => demanderDepotCaisse(ventesActives[0])}
                          disabled={loadingAction}
                          className="mt-3 w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                          <Banknote size={16} />
                          Demander dépôt
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reste</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mesVentes.map((vente) => (
                  <tr key={vente._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(vente.dateVente).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{vente.produitNom}</td>
                    <td className="px-4 py-3 text-sm">{vente.quantite}</td>
                    <td className="px-4 py-3 text-sm">{formatGNF(vente.prixVente)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatGNF(vente.montantTotal)}</td>
                    <td className="px-4 py-3 text-sm">
                      {vente.modePaiement === 'comptant' && '💵 Comptant'}
                      {vente.modePaiement === 'partiel' && '💸 Partiel'}
                      {vente.modePaiement === 'credit' && '🧾 Crédit'}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatGNF(vente.montantPaye)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{formatGNF(vente.resteAPayer)}</td>
                    <td className="px-4 py-3 text-sm">{vente.clientNom || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getStatutBadge(vente.statut)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {vente.statut === 'active' && (
                          <>
                            <button
                              onClick={() => demanderDepotCaisse(vente)}
                              disabled={loadingAction}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Demander le dépôt en caisse"
                            >
                              <Banknote size={14} />
                              <span className="text-xs">Déposer</span>
                            </button>
                            {vente.resteAPayer > 0 && (
                              <button
                                onClick={() => reglerReste(vente)}
                                disabled={loadingAction}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Régler le reste"
                              >
                                <DollarSign size={14} />
                                <span className="text-xs">Régler</span>
                              </button>
                            )}
                            <button
                              onClick={() => annulerVente(vente)}
                              disabled={loadingAction}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Annuler la vente"
                            >
                              <X size={14} />
                              <span className="text-xs">Annuler</span>
                            </button>
                          </>
                        )}
                        {vente.statut === 'depot_attente' && (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1">
                            <Clock size={12} />
                            En attente validation
                          </span>
                        )}
                        {vente.statut === 'depot_valide' && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Déposé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mesVentes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune vente enregistrée pour le moment</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">📦 Mon Stock Personnel</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl w-64"
              />
            </div>
          </div>
        </div>

        {filteredStocks.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Vous n'avez aucun produit en stock pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Contactez l'administrateur pour un approvisionnement</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredStocks.map((stock) => (
              <div key={stock._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{stock.produitNom}</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        stock.stockRestant <= stock.stockMin 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Stock restant: {stock.stockRestant} unités
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        Prix vente: {formatGNF(stock.prixVente)}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        stock.autoriserModificationPrixVente 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {stock.autoriserModificationPrixVente ? '✅ Prix modifiable' : '🔒 Prix fixe'}
                      </span>
                    </div>
                    {stock.stockRestant <= stock.stockMin && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Stock bas ! Il ne reste que {stock.stockRestant} unités
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openVenteModal(stock)}
                    disabled={stock.stockRestant === 0 || loadingAction}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <ShoppingCart size={18} />
                    Vendre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showVenteModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">💰 Enregistrer une vente</h3>
              <button onClick={() => setShowVenteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVente}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
                <p className="p-3 bg-gray-100 rounded-xl font-medium">{selectedStock.produitNom}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix unitaire (GNF)
                  {!selectedStock.autoriserModificationPrixVente && (
                    <span className="text-xs text-gray-400 ml-2">(fixe)</span>
                  )}
                  {selectedStock.autoriserModificationPrixVente && (
                    <span className="text-xs text-green-500 ml-2">(modifiable)</span>
                  )}
                </label>
                <input
                  type="number"
                  value={venteData.prixVente}
                  onChange={(e) => {
                    const newPrix = Number(e.target.value);
                    setVenteData(prev => ({ ...prev, prixVente: newPrix }));
                    const total = (parseInt(venteData.quantite) || 0) * newPrix;
                    if (venteData.modePaiement === 'comptant') {
                      setVenteData(prev => ({ ...prev, montantPaye: total, resteAPayer: 0 }));
                    } else if (venteData.modePaiement === 'credit') {
                      setVenteData(prev => ({ ...prev, montantPaye: 0, resteAPayer: total }));
                    } else if (venteData.modePaiement === 'partiel') {
                      const paye = Math.min(venteData.montantPaye || 0, total);
                      setVenteData(prev => ({ ...prev, montantPaye: paye, resteAPayer: total - paye }));
                    }
                  }}
                  disabled={!selectedStock.autoriserModificationPrixVente}
                  className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 ${
                    !selectedStock.autoriserModificationPrixVente ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  min="0"
                  step="1"
                  required
                />
                {!selectedStock.autoriserModificationPrixVente && (
                  <p className="text-xs text-gray-400 mt-1">
                    Prix fixe : {formatGNF(selectedStock.prixVente)}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité *</label>
                <input
                  type="number"
                  value={venteData.quantite}
                  onChange={handleQuantiteChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  placeholder="Quantité vendue"
                  min="1"
                  max={selectedStock.stockRestant}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Max: {selectedStock.stockRestant} unités</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement *</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="modePaiement"
                      value="comptant"
                      checked={venteData.modePaiement === 'comptant'}
                      onChange={() => handleModePaiementChange('comptant')}
                    />
                    <span>💵 Comptant total</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="modePaiement"
                      value="partiel"
                      checked={venteData.modePaiement === 'partiel'}
                      onChange={() => handleModePaiementChange('partiel')}
                    />
                    <span>💸 Paiement partiel</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="modePaiement"
                      value="credit"
                      checked={venteData.modePaiement === 'credit'}
                      onChange={() => handleModePaiementChange('credit')}
                    />
                    <span>🧾 Crédit</span>
                  </label>
                </div>
              </div>

              {venteData.modePaiement === 'partiel' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant payé (GNF)</label>
                  <input
                    type="number"
                    value={venteData.montantPaye}
                    onChange={(e) => handleMontantPayeChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    placeholder="Montant payé"
                    min="0"
                    max={getMontantTotal()}
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client (optionnel)</label>
                <input
                  type="text"
                  value={venteData.clientNom}
                  onChange={(e) => setVenteData({ ...venteData, clientNom: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  placeholder="Nom du client"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="font-medium text-gray-700">Récapitulatif</p>
                <div className="flex justify-between text-sm mt-2">
                  <span>Montant total :</span>
                  <span className="font-bold">{formatGNF(getMontantTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant payé :</span>
                  <span className="font-bold text-green-600">{formatGNF(venteData.montantPaye)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reste à payer :</span>
                  <span className="font-bold text-red-600">{formatGNF(venteData.resteAPayer)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowVenteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || !venteData.quantite || (venteData.modePaiement === 'partiel' && (!venteData.montantPaye || venteData.montantPaye <= 0))}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-md disabled:opacity-50"
                >
                  {loadingAction ? 'En cours...' : 'Confirmer la vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== NOUVEAU MODAL DE DEMANDE DE CAISSE STYLISÉ ===== */}
      {showDemandeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Banknote size={24} className="text-yellow-500" />
                Nouveau mouvement
              </h3>
              <button onClick={() => setShowDemandeModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Solde actuel */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-5 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">💰 Fluidité actuel en caisse</p>
                  <p className="text-2xl font-bold text-blue-700">{formatGNF(soldeCaisse)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  soldeCaisse === 0 ? 'bg-gray-200 text-gray-600' :
                  soldeCaisse > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {soldeCaisse === 0 ? '⚖️ Solde nul' : soldeCaisse > 0 ? '✅ Solde positif' : '⚠️ Solde négatif'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitDemande}>
              {/* Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  📅 Date
                </label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Lieu (select) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  📍 Lieu *
                </label>
                <select
                  value={demandeForm.lieu}
                  onChange={(e) => setDemandeForm(prev => ({ ...prev, lieu: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 appearance-none bg-white"
                  required
                >
                  <option value="">Sélectionner un lieu</option>
                  {lieuxDisponibles.map((lieu) => (
                    <option key={lieu.value} value={lieu.value}>
                      {lieu.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Détail */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText size={16} className="inline mr-1" />
                  📝 Détail *
                </label>
                <textarea
                  value={demandeForm.detail}
                  onChange={(e) => setDemandeForm(prev => ({ ...prev, detail: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 resize-none"
                  placeholder="Description détaillée..."
                  rows={2}
                  required
                />
              </div>

              {/* Entrée et Sortie (deux champs) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <PlusCircle size={16} className="inline mr-1 text-green-600" />
                    Entrée (GNF)
                  </label>
                  <input
                    type="number"
                    value={demandeForm.montantEntree || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDemandeForm(prev => ({
                        ...prev,
                        montantEntree: val,
                        montantSortie: val > 0 ? 0 : prev.montantSortie // vide la sortie si entrée > 0
                      }));
                    }}
                    className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: 1000000"
                    min="0"
                  />
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Ajoute de l'argent à la caisse
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MinusCircle size={16} className="inline mr-1 text-red-600" />
                    Sortie (GNF)
                  </label>
                  <input
                    type="number"
                    value={demandeForm.montantSortie || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDemandeForm(prev => ({
                        ...prev,
                        montantSortie: val,
                        montantEntree: val > 0 ? 0 : prev.montantEntree // vide l'entrée si sortie > 0
                      }));
                    }}
                    className="w-full p-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: 500000"
                    min="0"
                  />
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Retire de l'argent de la caisse
                  </p>
                </div>
              </div>

              {/* Quantité et prix unitaire (optionnels) */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (optionnel)</label>
                  <input
                    type="number"
                    value={demandeForm.quantite}
                    onChange={(e) => setDemandeForm(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (optionnel)</label>
                  <input
                    type="number"
                    value={demandeForm.prixUnitaire}
                    onChange={(e) => setDemandeForm(prev => ({ ...prev, prixUnitaire: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500"
                    placeholder="Prix unitaire (GNF)"
                    min="0"
                  />
                </div>
              </div> */}

              <div className="flex gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowDemandeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingDemande || 
                    (!demandeForm.montantEntree && !demandeForm.montantSortie) ||
                    !demandeForm.lieu || !demandeForm.detail.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loadingDemande ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default MonStockPersonnel;