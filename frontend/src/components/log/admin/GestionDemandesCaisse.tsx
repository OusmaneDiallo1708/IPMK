import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, XCircle, Banknote, User, 
  Package, DollarSign, RefreshCw, AlertCircle, 
  Trash2, Archive  // ✅ Icônes ajoutées
} from 'lucide-react';
import api from '../../../config/axiosConfig';

const GestionDemandesCaisse = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/allroute/demandes-caisse');
      setDemandes(res.data.data || []);
    } catch (error) {
      console.error('Erreur chargement demandes de caisse:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprouver = async (id) => {
    if (!confirm('Approuver cette demande ?')) return;
    try {
      const res = await api.put(`/api/allroute/demandes-caisse/approuver/${id}`);
      setMessage({ type: 'success', text: res.data.message });
      fetchDemandes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'approbation' });
    }
  };

  const handleRefuser = async (id) => {
    const comment = prompt('Motif du refus :');
    if (comment === null) return;
    try {
      const res = await api.put(`/api/allroute/demandes-caisse/refuser/${id}`, { commentaire: comment });
      setMessage({ type: 'success', text: res.data.message });
      fetchDemandes();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors du refus' });
    }
  };

  // ✅ Supprimer une demande (uniquement si déjà traitée)
  const handleSupprimer = async (id) => {
    if (!confirm('⚠️ Supprimer définitivement cette demande ?')) return;
    try {
      const res = await api.delete(`/api/allroute/demandes-caisse/${id}`);
      setMessage({ type: 'success', text: res.data.message });
      fetchDemandes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la suppression' });
    }
  };

  // ✅ Vider toutes les demandes traitées
  const handleViderTraitees = async () => {
    const count = demandes.filter(d => d.statut !== 'en_attente').length;
    if (count === 0) {
      setMessage({ type: 'warning', text: 'Aucune demande traitée à supprimer' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    if (!confirm(`⚠️ Supprimer définitivement toutes les ${count} demande(s) traitée(s) ?`)) return;
    try {
      const res = await api.delete('/api/allroute/demandes-caisse/vider-traitees');
      setMessage({ type: 'success', text: res.data.message });
      fetchDemandes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors du vidage' });
    }
  };

  const formatGNF = (amount) => {
    if (!amount && amount !== 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
  };

  // ✅ Statistiques rapides
  const stats = {
    total: demandes.length,
    enAttente: demandes.filter(d => d.statut === 'en_attente').length,
    approuvees: demandes.filter(d => d.statut === 'approuvee').length,
    refusees: demandes.filter(d => d.statut === 'refusee').length,
  };

  return (
    <div className="p-6">
      {/* En-tête avec compteurs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="text-blue-600" />
          Demandes de caisse (entrées / sorties)
        </h2>
        {/* ✅ Bouton Vider les traitées */}
        <button
          onClick={handleViderTraitees}
          disabled={stats.approuvees + stats.refusees === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
            stats.approuvees + stats.refusees > 0
              ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Archive size={16} />
          Vider les traitées ({stats.approuvees + stats.refusees})
        </button>
      </div>

      {/* ✅ Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-blue-100 text-sm">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <p className="text-yellow-100 text-sm">En attente</p>
          <p className="text-2xl font-bold">{stats.enAttente}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-green-100 text-sm">Approuvées</p>
          <p className="text-2xl font-bold">{stats.approuvees}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-red-100 text-sm">Refusées</p>
          <p className="text-2xl font-bold">{stats.refusees}</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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
          <p className="text-gray-500">Aucune demande de caisse</p>
          <p className="text-gray-400 text-sm mt-1">Les employés pourront demander des mouvements ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => (
            <div key={d._id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <User size={18} className="text-blue-500" />
                    <span className="font-semibold">{d.demandeur?.nomComplet || 'Inconnu'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      d.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {d.type === 'entree' ? '💰 Entrée' : '💸 Sortie'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                      d.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                      d.statut === 'approuvee' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.statut === 'en_attente' && <Clock size={12} />}
                      {d.statut === 'approuvee' && <CheckCircle size={12} />}
                      {d.statut === 'refusee' && <XCircle size={12} />}
                      {d.statut === 'en_attente' ? 'En attente' :
                       d.statut === 'approuvee' ? 'Approuvée' : 'Refusée'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={18} className="text-purple-500" />
                    <span className="font-medium">{d.lieu}</span>
                    <span className="text-gray-500 text-sm">— {d.detail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-green-500" />
                    <span className="text-xl font-bold text-green-600">{formatGNF(d.montant)}</span>
                  </div>
                  {d.commentaire && (
                    <div className="text-xs text-gray-500 mt-1">💬 {d.commentaire}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Demandé le {new Date(d.createdAt).toLocaleDateString()}
                    {d.dateTraitement && ` • Traité le ${new Date(d.dateTraitement).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {d.statut === 'en_attente' && (
                    <>
                      <button
                        onClick={() => handleApprouver(d._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Approuver
                      </button>
                      <button
                        onClick={() => handleRefuser(d._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircle size={16} /> Refuser
                      </button>
                    </>
                  )}
                  {d.statut === 'approuvee' && (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl flex items-center gap-2">
                      <CheckCircle size={16} /> Approuvée
                    </span>
                  )}
                  {d.statut === 'refusee' && (
                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl flex items-center gap-2">
                      <XCircle size={16} /> Refusée
                    </span>
                  )}
                  {/* ✅ Bouton Supprimer (visible uniquement si déjà traitée) */}
                  {d.statut !== 'en_attente' && (
                    <button
                      onClick={() => handleSupprimer(d._id)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition flex items-center gap-2"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={16} /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GestionDemandesCaisse;