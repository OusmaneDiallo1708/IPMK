// components/admin/StatsVentesUtilisateurs.jsx
import React, { useState, useEffect } from 'react';
import { Users, Package, DollarSign, TrendingUp, User, BarChart3, PieChart, Download, RefreshCw } from 'lucide-react';
import api from '../../../config/axiosConfig';

const StatsVentesUtilisateurs = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/utilisateur/stats-ventes');
      setStats(res.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGNF = (amount) => {
    if (!amount && amount !== 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
  };

  const handleExport = () => {
    if (!stats) return;
    setExporting(true);
    
    const csvRows = [
      ['Utilisateur', 'Produit', 'Quantité Vendue', 'Montant Total (GNF)', 'Nombre de Ventes']
    ];
    
    stats.ventesParUtilisateur?.forEach(user => {
      user.ventesParProduit?.forEach(prod => {
        csvRows.push([
          user.utilisateurNom,
          prod.produitNom,
          prod.quantiteTotale,
          prod.montantTotal,
          prod.nombreVentes || 1
        ]);
      });
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stats_ventes_utilisateurs.csv';
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-blue-600" />
          Statistiques des ventes par utilisateur
        </h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100"
        >
          <Download size={18} />
          Exporter CSV
        </button>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100">Total ventes</p>
              <p className="text-3xl font-bold">{stats.totalVentes}</p>
            </div>
            <Package size={32} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-100">Quantité totale</p>
              <p className="text-3xl font-bold">{stats.quantiteTotale}</p>
            </div>
            <TrendingUp size={32} className="text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-100">Chiffre d'affaires</p>
              <p className="text-2xl font-bold">{formatGNF(stats.montantTotal)}</p>
            </div>
            <DollarSign size={32} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-orange-100">Utilisateurs actifs</p>
              <p className="text-3xl font-bold">{stats.ventesParUtilisateur?.length || 0}</p>
            </div>
            <Users size={32} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Détail par utilisateur */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="text-blue-600" />
            Détail par utilisateur
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {stats.ventesParUtilisateur?.map((user, idx) => (
            <div key={idx} className="p-6">
              <button
                onClick={() => setSelectedUser(selectedUser === idx ? null : idx)}
                className="w-full flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{user.utilisateurNom}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-sm text-gray-500">Ventes: {user.quantiteTotale} unités</span>
                    <span className="text-sm text-gray-500">CA: {formatGNF(user.montantTotal)}</span>
                  </div>
                </div>
                <span className="text-gray-400">{selectedUser === idx ? '▲' : '▼'}</span>
              </button>
              
              {selectedUser === idx && (
                <div className="mt-4 pl-4 border-l-2 border-blue-200">
                  <h4 className="font-medium text-gray-700 mb-3">Détail par produit :</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.ventesParProduit?.map((prod, pIdx) => (
                      <div key={pIdx} className="bg-gray-50 rounded-xl p-3">
                        <p className="font-medium text-gray-800">{prod.produitNom}</p>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Quantité:</span>
                          <span className="font-medium">{prod.quantiteTotale}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Montant:</span>
                          <span className="font-medium text-green-600">{formatGNF(prod.montantTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Classement des produits */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PieChart className="text-purple-600" />
            Classement des produits les plus vendus
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.ventesParProduit?.sort((a,b) => b.montantTotal - a.montantTotal).map((prod, idx) => (
            <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-800">{prod.produitNom}</p>
                  <p className="text-sm text-gray-500">{prod.quantiteTotale} unités vendues</p>
                </div>
              </div>
              <p className="font-bold text-green-600">{formatGNF(prod.montantTotal)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsVentesUtilisateurs;