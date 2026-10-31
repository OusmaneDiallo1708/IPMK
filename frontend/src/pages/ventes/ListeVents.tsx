import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { 
  Eye, Search, Filter, Download, X, Calendar, DollarSign, 
  Package, BarChart3, CheckCircle, XCircle, Users, TrendingUp, 
  CreditCard, Receipt, Edit, Trash2, RefreshCw, PlusCircle,
  ChevronDown, ChevronUp, PieChart, List, CalendarDays, 
  TrendingDown
} from "lucide-react";
import api from "../../config/axiosConfig";

// Types
interface Vente {
  _id: string;
  date_vente: string;
  quantite: number;
  prix_unitaire: number;
  montantT?: number;
  produitNom?: string;
  produitDescription?: string;
  utilisateurNom?: string;
}

interface NotificationState { show: boolean; type: "success" | "error" | ""; message: string; }
interface StatsState { total: number; totalAmount: number; todayAmount: number; weekAmount: number; }

// ✅ Interface pour les totaux par mois/année
interface TotauxParMois {
  mois: string;
  annee: number;
  nombreVentes: number;
  montantTotal: number;
  moyenne: number;
}

interface TotauxParAnnee {
  annee: number;
  nombreVentes: number;
  montantTotal: number;
  moyenne: number;
}

// Formatage GNF
const formatGNF = (amount: number): string => {
  if (!amount && amount !== 0) return '0 GNF';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
};

const Notification: React.FC<{ type: "success" | "error"; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${type === "success" ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
        {type === "success" ? <CheckCircle className="text-green-500 mr-3" size={24} /> : <XCircle className="text-red-500 mr-3" size={24} />}
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-4"><X size={18} /></button>
      </div>
    </div>
  );
};

const ListeVents: React.FC = () => {
  // États existants
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [filteredVentes, setFilteredVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "", message: "" });
  
  // États pour le prélèvement
  const [showAlimenterModal, setShowAlimenterModal] = useState(false);
  const [montantAlimenter, setMontantAlimenter] = useState<number>(0);
  const [totalPreleve, setTotalPreleve] = useState<number>(0);
  const [resteAPrelever, setResteAPrelever] = useState<number>(0);

  // ✅ NOUVEAUX ÉTATS : mode d'affichage
  const [viewMode, setViewMode] = useState<'detail' | 'month' | 'year'>('detail');

  // ✅ NOUVEAUX ÉTATS : données agrégées
  const [totauxParMois, setTotauxParMois] = useState<TotauxParMois[]>([]);
  const [totauxParAnnee, setTotauxParAnnee] = useState<TotauxParAnnee[]>([]);

  const fetchVentes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/allroute/getAllVente');
      const data = res.data.ventes || [];
      setVentes(data);
      setFilteredVentes(data);
      // ✅ Mettre à jour les agrégations
      calculerAgregations(data);
    } catch (error) {
      setNotification({ show: true, type: "error", message: "Erreur lors du chargement" });
    } finally { setLoading(false); }
  };

  const fetchTotalPreleve = async () => {
    try {
      const res = await api.get('/api/allroute/total-preleve');
      setTotalPreleve(res.data.totalPreleve || 0);
    } catch (error) {
      console.error("Erreur récupération total prélevé:", error);
    }
  };

  // ✅ Fonction pour calculer les agrégations par mois et par année
  const calculerAgregations = (data: Vente[]) => {
    // Agrégation par mois
    const moisMap = new Map<string, { nombre: number; total: number }>();
    data.forEach(v => {
      const date = new Date(v.date_vente);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nomMois = date.toLocaleString('fr-FR', { month: 'long' });
      const annee = date.getFullYear();
      const key = `${nomMois} ${annee}`;
      if (!moisMap.has(key)) {
        moisMap.set(key, { nombre: 0, total: 0 });
      }
      const current = moisMap.get(key)!;
      current.nombre += 1;
      current.total += v.montantT || 0;
    });

    const moisArray: TotauxParMois[] = Array.from(moisMap.entries()).map(([mois, data]) => {
      const [nom, anneeStr] = mois.split(' ');
      return {
        mois: nom,
        annee: parseInt(anneeStr),
        nombreVentes: data.nombre,
        montantTotal: data.total,
        moyenne: data.nombre > 0 ? data.total / data.nombre : 0
      };
    });
    // Trier du plus récent au plus ancien
    moisArray.sort((a, b) => {
      if (a.annee !== b.annee) return b.annee - a.annee;
      const moisOrdre = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      return moisOrdre.indexOf(b.mois.toLowerCase()) - moisOrdre.indexOf(a.mois.toLowerCase());
    });
    setTotauxParMois(moisArray);

    // Agrégation par année
    const anneeMap = new Map<number, { nombre: number; total: number }>();
    data.forEach(v => {
      const annee = new Date(v.date_vente).getFullYear();
      if (!anneeMap.has(annee)) {
        anneeMap.set(annee, { nombre: 0, total: 0 });
      }
      const current = anneeMap.get(annee)!;
      current.nombre += 1;
      current.total += v.montantT || 0;
    });

    const anneeArray: TotauxParAnnee[] = Array.from(anneeMap.entries()).map(([annee, data]) => ({
      annee,
      nombreVentes: data.nombre,
      montantTotal: data.total,
      moyenne: data.nombre > 0 ? data.total / data.nombre : 0
    }));
    anneeArray.sort((a, b) => b.annee - a.annee);
    setTotauxParAnnee(anneeArray);
  };

  useEffect(() => {
    fetchVentes();
    fetchTotalPreleve();
  }, []);

  // Recalculer le reste à prélever
  useEffect(() => {
    const totalVentes = ventes.reduce((sum, v) => sum + (v.montantT || 0), 0);
    setResteAPrelever(totalVentes - totalPreleve);
  }, [ventes, totalPreleve]);

  // Filtres (uniquement en vue détaillée)
  useEffect(() => {
    if (viewMode !== 'detail') return;
    let results = ventes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(v => v.produitNom?.toLowerCase().includes(term) || v.utilisateurNom?.toLowerCase().includes(term));
    }
    if (filterDate === "today") {
      const today = new Date().toDateString();
      results = results.filter(v => new Date(v.date_vente).toDateString() === today);
    } else if (filterDate === "week") {
      const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      results = results.filter(v => new Date(v.date_vente) >= oneWeekAgo);
    } else if (filterDate === "month") {
      const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      results = results.filter(v => new Date(v.date_vente) >= oneMonthAgo);
    }
    setFilteredVentes(results);
  }, [searchTerm, filterDate, ventes, viewMode]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette vente ?")) return;
    try {
      await api.delete(`/api/allroute/deleteVente/${id}`);
      setNotification({ show: true, type: "success", message: "Vente supprimée" });
      fetchVentes();
    } catch (error) { setNotification({ show: true, type: "error", message: "Erreur lors de la suppression" }); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = "Date,Produit,Client,Quantité,Prix Unitaire,Montant Total\n" + ventes.map(v => 
        `"${new Date(v.date_vente).toLocaleDateString()}","${v.produitNom || ""}","${v.utilisateurNom || ""}",${v.quantite},${v.prix_unitaire},${v.montantT || 0}`
      ).join("\n");
      const link = document.createElement("a");
      link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
      link.download = "ventes.csv";
      link.click();
      setNotification({ show: true, type: "success", message: "Export réussi" });
    } catch (error) { setNotification({ show: true, type: "error", message: "Erreur export" }); }
    setExporting(false);
  };

  const handleAlimenterFluidite = async () => {
    if (montantAlimenter <= 0) {
      setNotification({ show: true, type: "error", message: "Montant invalide" });
      return;
    }
    if (montantAlimenter > resteAPrelever) {
      setNotification({ show: true, type: "error", message: `Le montant ne peut pas dépasser ${formatGNF(resteAPrelever)}` });
      return;
    }
    try {
      const res = await api.post('/api/allroute/alimenter-caisse', { montant: montantAlimenter });
      setNotification({ show: true, type: "success", message: res.data.message });
      setShowAlimenterModal(false);
      setMontantAlimenter(0);
      await fetchVentes();
      await fetchTotalPreleve();
      window.dispatchEvent(new CustomEvent('refreshStock'));
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error: any) {
      setNotification({ show: true, type: "error", message: error.response?.data?.message || "Erreur lors de l'alimentation" });
    }
  };

  // Statistiques globales
  const totalVentes = ventes.reduce((sum, v) => sum + (v.montantT || 0), 0);
  const totalRestant = totalVentes - totalPreleve;

  const stats: StatsState = {
    total: ventes.length,
    totalAmount: totalRestant,
    todayAmount: ventes.filter(v => new Date(v.date_vente).toDateString() === new Date().toDateString()).reduce((sum, v) => sum + (v.montantT || 0), 0),
    weekAmount: ventes.filter(v => new Date(v.date_vente) >= new Date(Date.now() - 7 * 86400000)).reduce((sum, v) => sum + (v.montantT || 0), 0),
  };

  const totalPreleveAff = totalPreleve;

  // Colonnes détaillées
  const columns = [
    { name: "Date", selector: (row: Vente) => new Date(row.date_vente).toLocaleDateString(), sortable: true, width: "110px" },
    { name: "Produit", selector: (row: Vente) => row.produitNom || "N/A", sortable: true },
    { name: "Client", selector: (row: Vente) => row.utilisateurNom || "N/A", sortable: true },
    { name: "Qté", selector: (row: Vente) => row.quantite, sortable: true, width: "70px" },
    { name: "Prix Unitaire", selector: (row: Vente) => formatGNF(row.prix_unitaire), sortable: true, width: "120px" },
    { name: "Total", selector: (row: Vente) => formatGNF(row.montantT || 0), sortable: true, width: "120px" },
    { name: "Actions", cell: (row: Vente) => (
      <button onClick={() => handleDelete(row._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
        <Trash2 size={16} />
      </button>
    ), width: "80px" },
  ];

  // Colonnes pour le tableau des mois
  const columnsMois = [
    { name: "Mois", selector: (row: TotauxParMois) => `${row.mois} ${row.annee}`, sortable: true, width: "150px" },
    { name: "Nb ventes", selector: (row: TotauxParMois) => row.nombreVentes, sortable: true, width: "100px" },
    { name: "Montant total", selector: (row: TotauxParMois) => formatGNF(row.montantTotal), sortable: true, width: "150px" },
    { name: "Moyenne/vente", selector: (row: TotauxParMois) => formatGNF(row.moyenne), sortable: true, width: "150px" },
  ];

  // Colonnes pour le tableau des années
  const columnsAnnee = [
    { name: "Année", selector: (row: TotauxParAnnee) => row.annee, sortable: true, width: "100px" },
    { name: "Nb ventes", selector: (row: TotauxParAnnee) => row.nombreVentes, sortable: true, width: "100px" },
    { name: "Montant total", selector: (row: TotauxParAnnee) => formatGNF(row.montantTotal), sortable: true, width: "150px" },
    { name: "Moyenne/vente", selector: (row: TotauxParAnnee) => formatGNF(row.moyenne), sortable: true, width: "150px" },
  ];

  return (
    <div className="space-y-6">
      {notification.show && <Notification type={notification.type as "success" | "error"} message={notification.message} onClose={() => setNotification({ show: false, type: "", message: "" })} />}
      
      {/* Stats Cards - inchangées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-blue-100">Total Ventes</p><p className="text-3xl font-bold">{stats.total}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><Receipt size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-green-100">Reste à encaisser</p><p className="text-3xl font-bold">{formatGNF(stats.totalAmount)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><DollarSign size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-purple-100">Ventes Aujourd'hui</p><p className="text-3xl font-bold">{formatGNF(stats.todayAmount)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><TrendingUp size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-orange-100">7 derniers jours</p><p className="text-3xl font-bold">{formatGNF(stats.weekAmount)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><BarChart3 size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-red-100">Prélevé</p><p className="text-3xl font-bold">{formatGNF(totalPreleveAff)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><Package size={28} /></div>
          </div>
        </div>
      </div>

      {/* ✅ Onglets de vue + filtres */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">📋 Historique des Ventes</h2>
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('detail')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'detail' 
                      ? 'bg-white text-blue-700 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List size={16} className="inline mr-1" />
                  Détail
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'month' 
                      ? 'bg-white text-blue-700 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <CalendarDays size={16} className="inline mr-1" />
                  Par mois
                </button>
                <button
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'year' 
                      ? 'bg-white text-blue-700 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <PieChart size={16} className="inline mr-1" />
                  Par année
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Filtres visibles uniquement en vue détaillée */}
              {viewMode === 'detail' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl" />
                  </div>
                  <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-4 py-2 border rounded-xl">
                    <option value="all">Tous</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </>
              )}
              <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl">
                <Download size={18} /> {exporting ? "..." : "Export CSV"}
              </button>
              <button
                onClick={() => setShowAlimenterModal(true)}
                disabled={resteAPrelever <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  resteAPrelever > 0
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <PlusCircle size={18} />
                Alimenter la fluidité
              </button>
            </div>
          </div>
          {viewMode === 'detail' && resteAPrelever > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Reste à prélever : <span className="font-bold text-green-600">{formatGNF(resteAPrelever)}</span>
            </p>
          )}
        </div>

        {/* ✅ Rendu selon le mode */}
        {loading ? (
          <div className="p-8 text-center"><RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" /></div>
        ) : viewMode === 'detail' ? (
          <DataTable 
            columns={columns} 
            data={filteredVentes} 
            pagination 
            highlightOnHover 
            pointerOnHover 
            responsive 
            striped 
            progressPending={loading} 
          />
        ) : viewMode === 'month' ? (
          <div className="p-4">
            {totauxParMois.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-600">Nombre de mois</p>
                    <p className="text-2xl font-bold text-blue-700">{totauxParMois.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-gray-600">Total des ventes</p>
                    <p className="text-2xl font-bold text-green-700">{formatGNF(totauxParMois.reduce((sum, m) => sum + m.montantTotal, 0))}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-gray-600">Moyenne par mois</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatGNF(totauxParMois.reduce((sum, m) => sum + m.montantTotal, 0) / totauxParMois.length)}
                    </p>
                  </div>
                </div>
                <DataTable 
                  columns={columnsMois} 
                  data={totauxParMois} 
                  pagination 
                  highlightOnHover 
                  pointerOnHover 
                  responsive 
                  striped 
                />
              </>
            )}
          </div>
        ) : viewMode === 'year' ? (
          <div className="p-4">
            {totauxParAnnee.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-gray-600">Nombre d'années</p>
                    <p className="text-2xl font-bold text-blue-700">{totauxParAnnee.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-gray-600">Total des ventes</p>
                    <p className="text-2xl font-bold text-green-700">{formatGNF(totauxParAnnee.reduce((sum, a) => sum + a.montantTotal, 0))}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-gray-600">Moyenne par année</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatGNF(totauxParAnnee.reduce((sum, a) => sum + a.montantTotal, 0) / totauxParAnnee.length)}
                    </p>
                  </div>
                </div>
                <DataTable 
                  columns={columnsAnnee} 
                  data={totauxParAnnee} 
                  pagination 
                  highlightOnHover 
                  pointerOnHover 
                  responsive 
                  striped 
                />
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Modal Alimenter - inchangé */}
      {showAlimenterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PlusCircle className="text-green-600" size={24} />
                Alimenter la fluidité
              </h3>
              <button onClick={() => setShowAlimenterModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Montant restant à prélever : <span className="font-bold text-green-600">{formatGNF(resteAPrelever)}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant à prélever (GNF)</label>
                <input
                  type="number"
                  value={montantAlimenter || ''}
                  onChange={(e) => setMontantAlimenter(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 500000"
                  min="1"
                  max={resteAPrelever}
                />
                <p className="text-xs text-gray-400 mt-1">Maximum : {formatGNF(resteAPrelever)}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAlimenterModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAlimenterFluidite}
                  disabled={montantAlimenter <= 0 || montantAlimenter > resteAPrelever}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
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

export default ListeVents;