import React, { useState, useEffect } from "react";
import { 
  Archive, Search, Filter, Download, Printer, Eye, 
  Calendar, DollarSign, Package, Receipt, RefreshCw,
  X, ChevronLeft, ChevronRight, Clock, User, FileText,
  Trash2, AlertCircle, CheckCircle, XCircle
} from "lucide-react";
import api from "../../config/axiosConfig";

// Formatage GNF
const formatGNF = (amount: number): string => {
  if (!amount && amount !== 0) return '0 GNF';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
};

// Formatage date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('fr-FR');
};

interface ArchiveItem {
  _id: string;
  type: 'vente' | 'stock';
  data: any[];
  montantTotal: number;
  dateArchivage: string;
  archivePar: string;
  createdAt: string;
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

const Archives: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [filteredArchives, setFilteredArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "vente" | "stock">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "success", message: "" });

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "success", message: "" }), 3000);
  };

  // Charger les archives
  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/allroute/archives');
      setArchives(res.data.data || []);
      setFilteredArchives(res.data.data || []);
    } catch (error) {
      console.error("Erreur chargement archives:", error);
      showNotification("error", "Erreur lors du chargement des archives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // Filtrer les archives
  useEffect(() => {
    let results = [...archives];

    // Filtre par type
    if (filterType !== "all") {
      results = results.filter(a => a.type === filterType);
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(a => 
        a.type.toLowerCase().includes(term) ||
        a.archivePar.toLowerCase().includes(term) ||
        a.montantTotal.toString().includes(term) ||
        (a.data?.length || 0).toString().includes(term)
      );
    }

    // Filtre par date
    if (startDate) {
      results = results.filter(a => new Date(a.dateArchivage) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      results = results.filter(a => new Date(a.dateArchivage) <= end);
    }

    setFilteredArchives(results);
    setCurrentPage(1);
  }, [searchTerm, filterType, startDate, endDate, archives]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredArchives.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage);

  // Statistiques
  const stats = {
    total: archives.length,
    ventes: archives.filter(a => a.type === 'vente').length,
    stocks: archives.filter(a => a.type === 'stock').length,
    montantTotal: archives.reduce((sum, a) => sum + a.montantTotal, 0)
  };

  // Exporter CSV
  const handleExport = () => {
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
    } catch (error) {
      showNotification("error", "Erreur lors de l'export");
    }
  };

  // Imprimer
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Archives - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📦 Archives des vidages de caisse</h1>
            <p>Date d'impression: ${new Date().toLocaleString()}</p>
            <p>Total: ${filteredArchives.length} archives | Montant total: ${formatGNF(stats.montantTotal)}</p>
          </div>
           <table>
            <thead>
              <tr><th>Type</th><th>Date</th><th>Archivé par</th><th>Éléments</th><th>Montant</th></tr>
            </thead>
            <tbody>
              ${filteredArchives.map(a => `
                <tr>
                  <td>${a.type === 'vente' ? '💰 Ventes' : '📦 Stocks'}</td>
                  <td>${formatDate(a.dateArchivage)}</td>
                  <td>${a.archivePar}</td>
                  <td>${a.data?.length || 0}</td>
                  <td>${formatGNF(a.montantTotal)}</td>
                </tr>
              `).join('')}
            </tbody>
           </table>
          <div class="footer">
            <p>Document généré automatiquement - Touramancy</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    showNotification("success", "Impression lancée");
  };

  // Supprimer une archive
  const handleDeleteArchive = async (id: string) => {
    if (!window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer cette archive ? Action irréversible !")) return;
    
    try {
      await api.delete(`/api/allroute/archives/${id}`);
      showNotification("success", "Archive supprimée avec succès");
      fetchArchives();
      if (selectedArchive?._id === id) setSelectedArchive(null);
    } catch (error) {
      showNotification("error", "Erreur lors de la suppression");
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ show: false, type: "success", message: "" })} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl">
            <Archive size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📦 Archives</h1>
            <p className="text-gray-500 mt-1">Historique complet des vidages de caisse</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
            <Download size={18} /> Exporter CSV
          </button>
          <button onClick={handlePrint} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
            <Printer size={18} /> Imprimer
          </button>
          <button onClick={fetchArchives} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2">
            <RefreshCw size={18} /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-blue-100">Total Archives</p><p className="text-3xl font-bold">{stats.total}</p></div>
            <Archive size={28} className="text-white/70" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-green-100">Archives Ventes</p><p className="text-3xl font-bold">{stats.ventes}</p></div>
            <Receipt size={28} className="text-white/70" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-purple-100">Archives Stocks</p><p className="text-3xl font-bold">{stats.stocks}</p></div>
            <Package size={28} className="text-white/70" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-center">
            <div><p className="text-orange-100">Montant total</p><p className="text-3xl font-bold">{formatGNF(stats.montantTotal)}</p></div>
            <DollarSign size={28} className="text-white/70" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Type, archivé par, montant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📋 Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-4 py-2 border rounded-xl">
                <option value="all">Tous</option>
                <option value="vente">💰 Ventes</option>
                <option value="stock">📦 Stocks</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date début</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 border rounded-xl" />
            </div>
            <button onClick={resetFilters} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2">
              <X size={16} /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Liste des archives */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center"><RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" /><p className="mt-2 text-gray-500">Chargement...</p></div>
          ) : filteredArchives.length === 0 ? (
            <div className="p-12 text-center"><Archive size={48} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune archive trouvée</p></div>
          ) : (
            currentItems.map((archive) => (
              <div key={archive._id} className={`p-5 hover:bg-gray-50 transition-colors cursor-pointer ${selectedArchive?._id === archive._id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedArchive(selectedArchive?._id === archive._id ? null : archive)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${archive.type === 'vente' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {archive.type === 'vente' ? '💰 Ventes' : '📦 Stocks'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs"><Clock size={12} /> {formatDate(archive.dateArchivage)}</div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs"><User size={12} /> {archive.archivePar}</div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-500">📊 {archive.data?.length || 0} éléments</span>
                      <span className="font-bold text-blue-600">{formatGNF(archive.montantTotal)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleDeleteArchive(archive._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </div>

                {/* Détail de l'archive (affiché quand sélectionnée) */}
                {selectedArchive?._id === archive._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileText size={16} /> Détail de l'archive</h4>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {archive.data?.slice(0, 50).map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 text-sm">
                          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(item, null, 2)}</pre>
                        </div>
                      ))}
                      {(archive.data?.length || 0) > 50 && (
                        <p className="text-center text-gray-500 text-sm py-2">... et {(archive.data?.length || 0) - 50} autres éléments</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredArchives.length > 0 && (
          <div className="p-5 border-t border-gray-200 flex justify-between items-center">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"><ChevronLeft size={16} /> Précédent</button>
            <span className="text-gray-600">Page {currentPage} sur {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1">Suivant <ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default Archives;