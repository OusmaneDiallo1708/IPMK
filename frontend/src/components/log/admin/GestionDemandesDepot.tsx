// frontend/src/components/admin/GestionDemandesDepot.tsx
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Banknote, User, Package, DollarSign, RefreshCw } from 'lucide-react';
import api from '../../../config/axiosConfig';

const GestionDemandesDepot = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/allroute/demandes-depot');
      setDemandes(res.data.demandes || []);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const validerDepot = async (venteId) => {
    if (!confirm('Valider ce dépôt ? L\'argent sera ajouté à la caisse principale.')) return;
    
    try {
      const res = await api.post(`/api/allroute/valider-depot/${venteId}`);
      setMessage({ type: 'success', text: res.data.message });
      fetchDemandes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la validation' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const formatGNF = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Banknote className="text-green-600" />
        Demandes de dépôt en caisse
      </h2>

      {message.text && (
        <div className={`mb-4 p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : demandes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <Clock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune demande de dépôt en attente</p>
          <p className="text-gray-400 text-sm mt-1">Les employés pourront demander à déposer leurs ventes ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((demande) => (
            <div key={demande._id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} className="text-blue-500" />
                    <span className="font-semibold">{demande.utilisateurNom || demande.utilisateur?.nomComplet}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock size={12} />
                      En attente
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={18} className="text-purple-500" />
                    <span className="font-medium">{demande.produitNom}</span>
                    <span className="text-gray-500">x{demande.quantite}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-green-500" />
                    <span className="text-xl font-bold text-green-600">{formatGNF(demande.montantTotal)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Vente du {new Date(demande.dateVente).toLocaleDateString()} • 
                    Demande du {new Date(demande.demandeDepot?.dateDemande).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => validerDepot(demande._id)}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition flex items-center gap-2"
                >
                  <Banknote size={18} />
                  Valider le dépôt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GestionDemandesDepot;