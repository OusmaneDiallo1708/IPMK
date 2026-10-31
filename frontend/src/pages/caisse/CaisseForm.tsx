import React, { useState, useEffect } from "react";
import { 
  DollarSign, TrendingUp, TrendingDown, Package, 
  Receipt, RefreshCw, AlertCircle, CheckCircle, 
  Calendar, BarChart3, CreditCard, XCircle, Trash2,
  Archive, Eye, Clock, Search, Filter, Download, Printer,
  X, ChevronLeft, ChevronRight, User, FileText,
  ChevronDown, ChevronUp   // ✅ ajout des flèches
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import api from "../../config/axiosConfig";
import { stockService } from '../stocks/StockService';
import ListeVents from '../ventes/ListeVents';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const formatGNF = (amount: number): string => {
  if (!amount && amount !== 0) return '0 GNF';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('fr-FR');
};

interface StatsData {
  totalVentes: number;
  totalStock: number;
  totalEnCaisse: number;
  ventesJour: number;
  ventesSemaine: number;
  ventesMois: number;
  ventesAnnee: number;
}

interface VenteParJour {
  _id: string;
  totalVentes: number;
  nombreVentes: number;
}

interface ArchiveItem {
  _id: string;
  type: 'vente' | 'stock';
  data: any[];
  montantTotal: number;
  dateArchivage: string;
  archivePar: string;
}

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning";
  message: string;
}

const Notification: React.FC<{ type: string; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: "from-emerald-500 to-green-600", icon: <CheckCircle size={20} className="text-white" /> },
    error: { bg: "from-red-500 to-rose-600", icon: <XCircle size={20} className="text-white" /> },
    warning: { bg: "from-amber-500 to-orange-600", icon: <AlertCircle size={20} className="text-white" /> }
  };

  const current = config[type as keyof typeof config] || config.error;

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`bg-gradient-to-r ${current.bg} text-white rounded-2xl shadow-2xl max-w-md`}>
        <div className="flex items-start p-3 gap-2">
          <div className="bg-white/20 rounded-xl p-1">{current.icon}</div>
          <div className="flex-1">
            <h4 className="font-bold uppercase text-xs">{type === "success" ? "Succès" : type === "warning" ? "Attention" : "Erreur"}</h4>
            <p className="text-white/90 text-xs mt-0.5">{message}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={16} /></button>
        </div>
      </div>
    </div>
  );
};

const CaisseForm: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showArchives, setShowArchives] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [filteredArchives, setFilteredArchives] = useState<ArchiveItem[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "vente" | "stock">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "success", message: "" });
  
  const [stats, setStats] = useState<StatsData>({
    totalVentes: 0,
    totalStock: 0,
    totalEnCaisse: 0,
    ventesJour: 0,
    ventesSemaine: 0,
    ventesMois: 0,
    ventesAnnee: 0
  });
  const [ventesParJour, setVentesParJour] = useState<VenteParJour[]>([]);
  const [period, setPeriod] = useState<'mois' | 'annee'>('mois');

  // ✅ États pour l'affichage des sections (toggle)
  const [showSalesHistory, setShowSalesHistory] = useState(false);

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "success", message: "" }), 3000);
  };

  const fetchArchives = async () => {
    setArchivesLoading(true);
    try {
      const res = await api.get('/api/allroute/archives');
      setArchives(res.data.data || []);
      setFilteredArchives(res.data.data || []);
    } catch (error) {
      console.error("Erreur chargement archives:", error);
      setArchives([]);
      setFilteredArchives([]);
    } finally {
      setArchivesLoading(false);
    }
  };

  useEffect(() => {
    let results = [...archives];
    if (filterType !== "all") results = results.filter(a => a.type === filterType);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(a => 
        a.type.toLowerCase().includes(term) ||
        a.archivePar.toLowerCase().includes(term) ||
        a.montantTotal.toString().includes(term)
      );
    }
    if (startDate) results = results.filter(a => new Date(a.dateArchivage) >= new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      results = results.filter(a => new Date(a.dateArchivage) <= end);
    }
    setFilteredArchives(results);
    setCurrentPage(1);
  }, [searchTerm, filterType, startDate, endDate, archives]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ventesRes = await api.get('/api/allroute/getAllVente');
      const ventes = ventesRes.data.ventes || [];
      const totalVentes = ventes.reduce((sum: number, v: any) => sum + (v.montantT || 0), 0);
      
      let totalStock = 0;
      try {
        const stocksRes = await stockService.getStocks({ page: 1, limit: 1 });
        if (stocksRes.success && stocksRes.data?.stats?.dernierTotal !== undefined) {
          totalStock = stocksRes.data.stats.dernierTotal;
        } else {
          totalStock = 0;
        }
      } catch (statsError) {
        console.warn("Erreur récupération stats caisse:", statsError);
        totalStock = 0;
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      let ventesJour = 0, ventesSemaine = 0, ventesMois = 0, ventesAnnee = 0;
      ventes.forEach((v: any) => {
        const dateVente = new Date(v.date_vente);
        const montant = v.montantT || 0;
        if (dateVente >= today) ventesJour += montant;
        if (dateVente >= weekAgo) ventesSemaine += montant;
        if (dateVente >= monthAgo) ventesMois += montant;
        if (dateVente >= yearAgo) ventesAnnee += montant;
      });
      
      const ventesParJourMap = new Map<string, number>();
      ventes.forEach((v: any) => {
        const date = new Date(v.date_vente).toISOString().split('T')[0];
        const montant = v.montantT || 0;
        ventesParJourMap.set(date, (ventesParJourMap.get(date) || 0) + montant);
      });
      
      let ventesParJourData = Array.from(ventesParJourMap.entries())
        .map(([date, total]) => ({ _id: date, totalVentes: total, nombreVentes: 0 }))
        .sort((a, b) => a._id.localeCompare(b._id));
      
      if (period === 'mois') {
        ventesParJourData = ventesParJourData.slice(-30);
      }
      
      setVentesParJour(ventesParJourData);
      
      setStats({
        totalVentes,
        totalStock,
        totalEnCaisse: totalVentes + totalStock,
        ventesJour,
        ventesSemaine,
        ventesMois,
        ventesAnnee
      });
      
    } catch (error) {
      console.error("Erreur chargement données:", error);
      showNotification("error", "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('refreshVentes', handleRefresh);
    window.addEventListener('refreshStock', handleRefresh);
    return () => {
      window.removeEventListener('refreshVentes', handleRefresh);
      window.removeEventListener('refreshStock', handleRefresh);
    };
  }, [period]);
  
  const handleViderCaisse = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/api/allroute/ventes/archiver-et-vider');
      await api.post('/api/allroute/stocks/archiver-et-vider');
      
      showNotification("success", "✅ Caisse vidée avec succès ! Toutes les ventes et stocks ont été archivés.");
      
      setTimeout(() => {
        fetchData();
        if (showArchives) fetchArchives();
        window.dispatchEvent(new CustomEvent('refreshVentes'));
        window.dispatchEvent(new CustomEvent('refreshStock'));
      }, 1500);
      
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Erreur vidage caisse:", error);
      showNotification("error", "Erreur lors du vidage de la caisse");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenArchives = async () => {
    await fetchArchives();
    setShowArchives(true);
    setSelectedArchive(null);
    setSearchTerm("");
    setFilterType("all");
    setStartDate("");
    setEndDate("");
  };

  // ✅ Supprimer une archive (corbeille)
  const handleDeleteArchive = async (id: string) => {
    if (!window.confirm("⚠️ Supprimer définitivement cette archive ?")) return;
    try {
      await api.delete(`/api/allroute/archives/${id}`);
      showNotification("success", "Archive supprimée avec succès");
      fetchArchives();
    } catch (error) {
      console.error("Erreur suppression archive:", error);
      showNotification("error", "Erreur lors de la suppression");
    }
  };
  
  const handleExport = () => {
    if (filteredArchives.length === 0) { showNotification("warning", "Aucune archive à exporter"); return; }
    try {
      const csvContent = [
        ["ID", "Type", "Date d'archivage", "Archivé par", "Nombre d'éléments", "Montant total (GNF)"],
        ...filteredArchives.map(a => [
          a._id,
          a.type === 'vente' ? 'Ventes' : 'Stocks',
          formatDate(a.dateArchivage),
          a.archivePar,
          a.data?.length || 0,
          a.montantTotal
        ])
      ].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute("download", `archives_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification("success", "Export CSV réussi !");
    } catch (error) { showNotification("error", "Erreur lors de l'export"); }
  };

  const handlePrint = () => {
    if (filteredArchives.length === 0) { showNotification("warning", "Aucune archive à imprimer"); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Archives - ${new Date().toLocaleDateString()}</title>
        <style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#3b82f6;color:white}</style></head>
        <body><h1>Archives</h1><table><thead><tr><th>Type</th><th>Date</th><th>Archivé par</th><th>Éléments</th><th>Montant</th></tr></thead><tbody>
        ${filteredArchives.map(a => `<tr><td>${a.type === 'vente' ? 'Ventes' : 'Stocks'}</td><td>${formatDate(a.dateArchivage)}</td><td>${a.archivePar}</td><td>${a.data?.length || 0}</td><td>${formatGNF(a.montantTotal)}</td></tr`).join('')}
        </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const statsArchives = {
    total: archives.length,
    ventes: archives.filter(a => a.type === 'vente').length,
    stocks: archives.filter(a => a.type === 'stock').length,
    montantTotal: archives.reduce((sum, a) => sum + a.montantTotal, 0)
  };

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredArchives.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage);
  
  const chartData = {
    labels: ventesParJour.map(v => new Date(v._id).toLocaleDateString('fr-FR')),
    datasets: [{
      label: 'Ventes (GNF)',
      data: ventesParJour.map(v => v.totalVentes),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const }, tooltip: { callbacks: { label: (context: any) => `${context.dataset.label}: ${formatGNF(context.raw)}` } } },
    scales: { y: { ticks: { callback: (value: any) => formatGNF(value) } } }
  };
  
  const pieData = {
    labels: ['Ventes réalisées', 'Stock en valeur'],
    datasets: [{ data: [stats.totalVentes, stats.totalStock], backgroundColor: ['rgb(34, 197, 94)', 'rgb(59, 130, 246)'], borderWidth: 0 }]
  };
  
  if (loading && !showArchives && !showSalesHistory) {
    return <div className="flex justify-center items-center h-96"><RefreshCw className="animate-spin h-12 w-12 text-blue-600" /></div>;
  }
  
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ show: false, type: "success", message: "" })} />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">💰 Gestion de la Caisse</h1>
          <p className="text-gray-500 mt-1">Suivi des ventes et du stock (Franc Guinéen - GNF)</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* ✅ Bouton Historique des Ventes (toggle) */}
          <button 
            onClick={() => setShowSalesHistory(!showSalesHistory)} 
            className={`px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 ${
              showSalesHistory 
                ? 'bg-gradient-to-r from-emerald-700 to-green-800 text-white' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            }`}
          >
            <Receipt size={20} />
            <span>Historique des Ventes</span>
            {showSalesHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {/* ✅ Bouton Archives (toggle) */}
          <button 
            onClick={() => {
              if (!showArchives) handleOpenArchives();
              else setShowArchives(false);
            }}
            className={`px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 ${
              showArchives 
                ? 'bg-gradient-to-r from-indigo-700 to-blue-800 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
            }`}
          >
            <Archive size={20} />
            <span>Archives</span>
            {showArchives ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <button onClick={() => setShowConfirmModal(true)} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
            <RefreshCw size={20} /><span>Vider la caisse</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-green-100">Total Vendu</p><p className="text-3xl font-bold">{formatGNF(stats.totalVentes)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><Receipt size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-blue-100">FluiditéDuCach</p><p className="text-3xl font-bold">{formatGNF(stats.totalStock)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><Package size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-purple-100">Total en Caisse</p><p className="text-3xl font-bold">{formatGNF(stats.totalEnCaisse)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><DollarSign size={28} /></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-orange-100">Ventes Mois</p><p className="text-3xl font-bold">{formatGNF(stats.ventesMois)}</p></div>
            <div className="bg-white/20 rounded-xl p-3"><TrendingUp size={28} /></div>
          </div>
        </div>
      </div>
      
      {/* ✅ AFFICHAGE HISTORIQUE DES VENTES (toggle avec flèche) */}
      {showSalesHistory && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div 
            className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-between items-center cursor-pointer"
            onClick={() => setShowSalesHistory(false)}
          >
            <div className="flex items-center gap-2">
              <Receipt className="text-green-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">📋 Historique complet des ventes</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Fermer</span>
              <ChevronUp size={20} className="text-gray-600" />
            </div>
          </div>
          <div className="p-4">
            <ListeVents />
          </div>
        </div>
      )}
      
      {/* ✅ AFFICHAGE ARCHIVES (toggle avec flèche) */}
      {showArchives ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div 
            className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center cursor-pointer"
            onClick={() => setShowArchives(false)}
          >
            <div className="flex items-center gap-2">
              <Archive className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">📦 Archives des vidages de caisse</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Fermer</span>
              <ChevronUp size={20} className="text-gray-600" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 p-5 bg-gray-50 border-b">
            <div className="text-center"><p className="text-2xl font-bold text-blue-600">{statsArchives.total}</p><p className="text-xs text-gray-500">Total Archives</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-green-600">{statsArchives.ventes}</p><p className="text-xs text-gray-500">Ventes</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-purple-600">{statsArchives.stocks}</p><p className="text-xs text-gray-500">Stocks</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-orange-600">{formatGNF(statsArchives.montantTotal)}</p><p className="text-xs text-gray-500">Montant total</p></div>
          </div>
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]"><label className="block text-sm font-medium text-gray-700 mb-1">🔍 Recherche</label><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Type, archivé par..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">📋 Type</label><select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-4 py-2 border rounded-xl"><option value="all">Tous</option><option value="vente">💰 Ventes</option><option value="stock">📦 Stocks</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">📅 Date début</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">📅 Date fin</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 border rounded-xl" /></div>
              <button onClick={() => { setSearchTerm(""); setFilterType("all"); setStartDate(""); setEndDate(""); }} className="px-4 py-2 bg-gray-200 rounded-xl"><X size={16} /> Réinitialiser</button>
              <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2"><Download size={16} /> CSV</button>
              <button onClick={handlePrint} className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2"><Printer size={16} /> Imprimer</button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {archivesLoading ? <div className="p-12 text-center"><RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" /></div>
            : filteredArchives.length === 0 ? <div className="p-12 text-center"><Archive size={48} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune archive trouvée</p></div>
            : currentItems.map((archive) => (
                <div key={archive._id} className={`p-4 hover:bg-gray-50 ${selectedArchive?._id === archive._id ? 'bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${archive.type === 'vente' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{archive.type === 'vente' ? '💰 Ventes' : '📦 Stocks'}</div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs"><Clock size={12} /> {formatDate(archive.dateArchivage)}</div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs"><User size={12} /> {archive.archivePar}</div>
                        <span className="text-xs font-bold text-blue-600">{formatGNF(archive.montantTotal)}</span>
                        <span className="text-xs text-gray-500">📊 {archive.data?.length || 0} éléments</span>
                      </div>
                      {/* ✅ Affichage des données structurées */}
                      {archive.data && archive.data.length > 0 && (
                        <div className="mt-2 border rounded-lg overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                {archive.type === 'stock' ? (
                                  <>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lieu</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Détail</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Entrée (GNF)</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sortie (GNF)</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (GNF)</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qté</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {archive.data.slice(0, 10).map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {archive.type === 'stock' 
                                      ? new Date(item.date).toLocaleDateString()
                                      : new Date(item.date_vente).toLocaleDateString()
                                    }
                                  </td>
                                  {archive.type === 'stock' ? (
                                    <>
                                      <td className="px-3 py-2 text-gray-700">{item.lieu || '-'}</td>
                                      <td className="px-3 py-2 text-gray-700">{item.detail || '-'}</td>
                                      <td className="px-3 py-2 text-right text-green-600 font-medium">
                                        {item.type === 'entree' ? formatGNF(item.montant) : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-right text-red-600 font-medium">
                                        {item.type === 'sortie' ? formatGNF(item.montant) : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-blue-600">
                                        {formatGNF(item.montantTotal || item.total || 0)}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2 text-gray-700 font-medium">{item.produitNom || '-'}</td>
                                      <td className="px-3 py-2 text-gray-700">{item.utilisateurNom || '-'}</td>
                                      <td className="px-3 py-2 text-right">{item.quantite}</td>
                                      <td className="px-3 py-2 text-right">{formatGNF(item.prix_unitaire)}</td>
                                      <td className="px-3 py-2 text-right font-bold text-green-600">{formatGNF(item.montantT)}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                              {(archive.data?.length || 0) > 10 && (
                                <tr>
                                  <td colSpan={archive.type === 'stock' ? 7 : 6} className="px-3 py-2 text-center text-gray-500 text-xs">
                                    ... et {(archive.data?.length || 0) - 10} autres éléments
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold">
                              <tr>
                                <td colSpan={archive.type === 'stock' ? 4 : 4} className="px-3 py-2 text-right text-gray-700">Total :</td>
                                <td className="px-3 py-2 text-right text-blue-600">
                                  {formatGNF(archive.montantTotal)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteArchive(archive._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
            ))}
          </div>
          {filteredArchives.length > 0 && (
            <div className="p-5 border-t border-gray-200 flex justify-between items-center">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-xl disabled:opacity-50"><ChevronLeft size={16} /> Précédent</button>
              <span className="text-gray-600">Page {currentPage} sur {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-xl disabled:opacity-50">Suivant <ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      ) : (
        // Affichage par défaut (graphiques, stats)
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-5 border"><div className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-xl"><Calendar size={24} className="text-blue-600" /></div><div><p className="text-gray-500 text-sm">Ventes Aujourd'hui</p><p className="text-2xl font-bold">{formatGNF(stats.ventesJour)}</p></div></div></div>
            <div className="bg-white rounded-2xl shadow-lg p-5 border"><div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><TrendingUp size={24} className="text-green-600" /></div><div><p className="text-gray-500 text-sm">Ventes 7 jours</p><p className="text-2xl font-bold">{formatGNF(stats.ventesSemaine)}</p></div></div></div>
            <div className="bg-white rounded-2xl shadow-lg p-5 border"><div className="flex items-center gap-3"><div className="p-3 bg-purple-100 rounded-xl"><BarChart3 size={24} className="text-purple-600" /></div><div><p className="text-gray-500 text-sm">Ventes Année</p><p className="text-2xl font-bold">{formatGNF(stats.ventesAnnee)}</p></div></div></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">📈 Évolution des ventes</h2><div className="flex gap-2"><button onClick={() => setPeriod('mois')} className={`px-3 py-1 rounded-lg text-sm ${period === 'mois' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>30 derniers jours</button><button onClick={() => setPeriod('annee')} className={`px-3 py-1 rounded-lg text-sm ${period === 'annee' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Année</button></div></div>
              <div className="h-80"><Line data={chartData} options={chartOptions} /></div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <h2 className="text-xl font-bold mb-4">🥧 Répartition Ventes / Stock</h2>
              <div className="h-64"><Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
              <div className="mt-4 space-y-2"><div className="flex justify-between p-2 bg-green-50 rounded-lg"><span>💰 Ventes réalisées</span><span className="font-bold">{formatGNF(stats.totalVentes)}</span></div><div className="flex justify-between p-2 bg-blue-50 rounded-lg"><span>📦 Fluidité en valeur</span><span className="font-bold">{formatGNF(stats.totalStock)}</span></div></div>
            </div>
          </div>
        </>
      )}
      
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl"><div className="flex items-center gap-2"><AlertCircle className="text-red-600" size={24} /><h2 className="text-2xl font-bold">⚠️ Vider la caisse</h2></div></div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">Êtes-vous sûr de vouloir <span className="font-bold text-red-600">vider la caisse</span> ?</p>
              <div className="bg-yellow-50 p-4 rounded-xl border"><p className="text-yellow-800 text-sm">⚠️ Cette action va :</p><ul className="text-yellow-700 text-sm mt-2 list-disc list-inside"><li>Archiver TOUTES les ventes et tous les stocks</li><li>Réinitialiser le stock à 0</li><li>Remettre le total en caisse à 0</li></ul><p className="text-blue-600 text-sm font-bold mt-2">✓ Les archives seront conservées !</p></div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border rounded-xl">Annuler</button>
                <button onClick={handleViderCaisse} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  {isSubmitting ? "Traitement..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default CaisseForm;