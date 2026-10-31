// @ts-nocheck
import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Eye, Edit, Trash2, Search, Filter, Download, Plus, ChevronDown, X, AlertCircle, Calendar, DollarSign, Package, BarChart3, CheckCircle, XCircle } from "lucide-react";
import api from "../../config/axiosConfig";

// Types
interface Produit {
  _id: string;
  categorieNom: string;
  categorieDescription: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  stock_min: number;
  date_ajout: string;
  date_expiration: string;
  image?: string;
}

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "";
  message: string;
}

interface NotificationProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
}

interface StatusBadgeProps {
  quantity: number;
  minStock: number;
}

interface ApiResponse {
  produit: Produit[];
  message?: string;
}

interface StatsState {
  total: number;
  outOfStock: number;
  lowStock: number;
  inStock: number;
}

// 🔹 Notification élégante
const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 animate-in slide-in-from-right-10`}>
      <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${
        type === "success" 
          ? "bg-green-50 border-green-500 text-green-700" 
          : "bg-red-50 border-red-500 text-red-700"
      }`}>
        <div className="mr-3">
          {type === "success" ? (
            <CheckCircle size={24} className="text-green-500" />
          ) : (
            <XCircle size={24} className="text-red-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// 🔹 Modal Premium avec animations
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = "md" }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-md transition-all duration-300">
      <div 
        className={`bg-white rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-95 animate-in fade-in-90 zoom-in-90`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// 🔹 Squelette de chargement premium
const SkeletonRow: React.FC = () => (
  <div className="flex items-center p-4 space-x-4 border-b border-gray-100 animate-pulse">
    <div className="h-10 w-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
    </div>
    <div className="h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
  </div>
);

// 🔹 Badge de statut avec style premium
const StatusBadge: React.FC<StatusBadgeProps> = ({ quantity, minStock }) => {
  if (quantity === 0) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
        <AlertCircle size={12} />
        Rupture
      </span>
    );
  } else if (quantity <= minStock) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
        <AlertCircle size={12} />
        Stock bas
      </span>
    );
  } else {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
        Disponible
      </span>
    );
  }
};

const ListeProduits: React.FC = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [filteredProduits, setFilteredProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [modalType, setModalType] = useState<string>("");
  const [editData, setEditData] = useState<Partial<Produit>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [exporting, setExporting] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Produit[]>([]);
  const [toggleCleared, setToggleCleared] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "", message: "" });

  // ✅ Fonction de chargement des produits (réutilisable)
  const fetchProduits = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse>("/api/allroute/getAllProduit");
      console.log("📥 Réponse produits :", res.data); // Pour déboguer
      
      // ✅ On prend 'data' en priorité, puis 'produit', puis le tableau
      const produitsData = res.data.data || res.data.produit || res.data || [];
      setProduits(produitsData);
      setFilteredProduits(produitsData);
    } catch (error) {
      console.error("Erreur récupération produits :", error);
      setLoading(false);
      showNotification("error", "Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial + écoute de l'événement refreshProduits
  useEffect(() => {
    fetchProduits();

    const handleRefresh = () => {
      fetchProduits();
    };
    window.addEventListener('refreshProduits', handleRefresh);

    return () => {
      window.removeEventListener('refreshProduits', handleRefresh);
    };
  }, []);

  // Filtrage des produits (recherche + filtre stock)
  useEffect(() => {
    let results = produits;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (p) => 
          p.categorieNom.toLowerCase().includes(term) ||
          p.categorieDescription.toLowerCase().includes(term) ||
          p.prixVente.toString().includes(term)
      );
    }
    
    if (filterStock === "low") {
      results = results.filter(p => p.quantite <= p.stock_min && p.quantite > 0);
    } else if (filterStock === "out") {
      results = results.filter(p => p.quantite === 0);
    } else if (filterStock === "good") {
      results = results.filter(p => p.quantite > p.stock_min);
    }
    
    setFilteredProduits(results);
  }, [searchTerm, filterStock, produits]);

  const showNotification = (type: "success" | "error", message: string): void => {
    setNotification({ show: true, type, message });
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    
    try {
      await api.delete(`/api/allroute/deleteProduit/${id}`);
      await fetchProduits();
      showNotification("success", "Produit supprimé avec succès !");
    } catch (error) {
      console.error("Erreur suppression :", error);
      showNotification("error", "Impossible de supprimer le produit.");
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRows.length} produits ?`)) return;
    
    try {
      for (const row of selectedRows) {
        await api.delete(`/api/allroute/deleteProduit/${row._id}`);
      }
      await fetchProduits();
      setSelectedRows([]);
      setToggleCleared(!toggleCleared);
      showNotification("success", `${selectedRows.length} produit(s) supprimé(s) avec succès !`);
    } catch (error) {
      console.error("Erreur suppression multiple :", error);
      showNotification("error", "Impossible de supprimer les produits sélectionnés.");
    }
  };

  const openModal = (produit: Produit, type: string): void => {
    setSelectedProduit(produit);
    setModalType(type);
    if (type === "modifier") {
      setEditData({
        quantite: produit.quantite,
        prixAchat: produit.prixAchat,
        prixVente: produit.prixVente,
        stock_min: produit.stock_min,
        date_ajout: produit.date_ajout.slice(0, 10),
        date_expiration: produit.date_expiration.slice(0, 10),
      });
    }
  };

  const closeModal = (): void => {
    setSelectedProduit(null);
    setModalType("");
    setEditData({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      await api.put<{ produit: Produit }>(
        `/api/allroute/updateProduit/${selectedProduit?._id}`,
        editData
      );
      await fetchProduits();
      closeModal();
      showNotification("success", "Produit modifié avec succès !");
    } catch (error) {
      console.error("Erreur modification :", error);
      showNotification("error", "Impossible de modifier le produit.");
    }
  };

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Nom,Description,Quantité,Prix Achat,Prix Vente,Stock Min,Date Ajout,Date Expiration\n"
        + produits.map(p => 
            `"${p.categorieNom}","${p.categorieDescription}",${p.quantite},${p.prixAchat},${p.prixVente},${p.stock_min},"${new Date(p.date_ajout).toLocaleDateString()}","${new Date(p.date_expiration).toLocaleDateString()}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "produits_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("success", "Exportation réussie !");
    } catch (error) {
      console.error("Erreur export :", error);
      showNotification("error", "Erreur lors de l'exportation.");
    }
    setExporting(false);
  };

  const handleRowSelected = React.useCallback((state: { selectedRows: Produit[] }) => {
    setSelectedRows(state.selectedRows);
  }, []);

  const contextActions = React.useMemo(() => {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg">
        <span>{selectedRows.length} produit(s) sélectionné(s)</span>
        <button 
          onClick={handleBulkDelete}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm transition-colors"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    );
  }, [selectedRows]);

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        borderTop: '1px solid #f1f5f9',
        borderBottom: '2px solid #e2e8f0',
        color: '#64748b',
      },
    },
    headCells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
      },
    },
    rows: {
      style: {
        fontSize: '0.9rem',
        padding: '12px 8px',
        '&:not(:last-of-type)': {
          borderBottom: '1px solid #f1f5f9',
        },
        '&:hover': {
          backgroundColor: '#f8fafc',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f1f5f9',
        borderBottomColor: '#e2e8f0',
      },
    },
    cells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
      },
    },
    pagination: {
      style: {
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        color: '#64748b',
      },
    },
    contextMenu: {
      style: {
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  };

  const columns = [
    {
      name: "Produit",
      selector: (row: Produit) => (
        <div className="flex items-center">
          {row.image ? (
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:4999'}${row.image}`}
              alt="Produit"
              className="w-12 h-12 object-cover rounded-xl shadow-sm mr-3 border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3 shadow-sm border border-gray-200">
              <Package size={20} className="text-blue-600" />
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900">{row.categorieNom}</div>
            <div className="text-xs text-gray-500 truncate max-w-xs">{row.categorieDescription}</div>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: "280px",
      grow: 2,
    },
    {
      name: "Stock",
      selector: (row: Produit) => (
        <div className="flex flex-col">
          <span className={`font-bold ${
            row.quantite === 0 ? 'text-red-600' : 
            row.quantite <= row.stock_min ? 'text-amber-600' : 'text-green-600'
          }`}>
            {row.quantite} unités
          </span>
          <span className="text-xs text-gray-500">Min: {row.stock_min}</span>
        </div>
      ),
      sortable: true,
      width: "120px",
    },
    {
      name: "Prix",
      selector: (row: Produit) => (
        <div className="flex flex-col">
          <span className="text-gray-900 font-bold flex items-center gap-1">
            <DollarSign size={14} className="text-green-600" />
            {row.prixVente}
          </span>
          <span className="text-xs text-gray-500">Achat: {row.prixAchat} GNF</span>
        </div>
      ),
      sortable: true,
      width: "120px",
    },
    {
      name: "Dates",
      selector: (row: Produit) => (
        <div className="flex flex-col">
          <span className="text-xs flex items-center gap-1">
            <Calendar size={12} className="text-blue-500" />
            Ajout: {new Date(row.date_ajout).toLocaleDateString()}
          </span>
          <span className={`text-xs flex items-center gap-1 ${
            new Date(row.date_expiration) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'
          }`}>
            <Calendar size={12} className={
              new Date(row.date_expiration) < new Date() ? 'text-red-500' : 'text-gray-400'
            } />
            Exp: {new Date(row.date_expiration).toLocaleDateString()}
          </span>
        </div>
      ),
      sortable: true,
      width: "150px",
    },
    {
      name: "Statut",
      selector: (row: Produit) => <StatusBadge quantity={row.quantite} minStock={row.stock_min} />,
      sortable: true,
      width: "120px",
      center: true,
    },
    {
      name: "Actions",
      cell: (row: Produit) => (
        <div className="flex gap-2">
          <button
            onClick={() => openModal(row, "afficher")}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
            title="Voir détails"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openModal(row, "modifier")}
            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
            title="Modifier"
          >
            <Edit size={16} />
            <span className="text-xs">Modifier</span>
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "220px",
    },
  ];

  const stats: StatsState = {
    total: produits.length,
    outOfStock: produits.filter(p => p.quantite === 0).length,
    lowStock: produits.filter(p => p.quantite > 0 && p.quantite <= p.stock_min).length,
    inStock: produits.filter(p => p.quantite > p.stock_min).length
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-8 border border-gray-100">
      {notification.show && (
        <Notification 
          type={notification.type as "success" | "error"} 
          message={notification.message} 
          onClose={() => setNotification({ show: false, type: "", message: "" })} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-blue-800">{stats.total}</h3>
              <p className="text-sm text-blue-600">Total Produits</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <Package className="text-blue-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-green-800">{stats.inStock}</h3>
              <p className="text-sm text-green-600">En Stock</p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <BarChart3 className="text-green-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-amber-800">{stats.lowStock}</h3>
              <p className="text-sm text-amber-600">Stock Faible</p>
            </div>
            <div className="p-3 bg-amber-200 rounded-full">
              <AlertCircle className="text-amber-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-red-800">{stats.outOfStock}</h3>
              <p className="text-sm text-red-600">Rupture</p>
            </div>
            <div className="p-3 bg-red-200 rounded-full">
              <X className="text-red-700" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
          Inventaire des Produits
          <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredProduits.length} produits
          </span>
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full shadow-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterStock}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStock(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm"
            >
              <option value="all">Tous les stocks</option>
              <option value="good">Stock bon</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
          
          <button
            onClick={handleExport}
            disabled={exporting || produits.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download size={16} />
            )}
            Exporter
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProduits}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[5, 10, 20, 50]}
        highlightOnHover
        pointerOnHover
        responsive
        selectableRows
        selectableRowsHighlight
        onSelectedRowsChange={handleRowSelected}
        contextActions={contextActions}
        clearSelectedRows={toggleCleared}
        progressPending={loading}
        progressComponent={
          <div className="space-y-3 py-8">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        }
        customStyles={customStyles}
        noDataComponent={
          <div className="py-16 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche ou de filtrage</p>
          </div>
        }
      />

      {/* Modal d'affichage */}
      <Modal isOpen={modalType === "afficher"} onClose={closeModal} title="Détails du produit" size="lg">
        {selectedProduit && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              {selectedProduit.image ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:4999'}${selectedProduit.image}`} 
                  alt="Produit" 
                  className="w-40 h-40 object-cover rounded-2xl shadow-md border border-gray-200" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-md border border-gray-200">
                  <Package size={40} className="text-blue-600" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduit.categorieNom}</h4>
                <p className="text-gray-600 mb-4">{selectedProduit.categorieDescription}</p>
                
                <div className="flex items-center gap-2">
                  <StatusBadge quantity={selectedProduit.quantite} minStock={selectedProduit.stock_min} />
                  <span className="text-sm text-gray-500">
                    {selectedProduit.quantite} / {selectedProduit.stock_min} unités
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Package size={18} className="text-blue-500" />
                  Informations de stock
                </h5>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantité:</span>
                  <span className="font-medium">{selectedProduit.quantite} unités</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock minimum:</span>
                  <span className="font-medium">{selectedProduit.stock_min} unités</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-500" />
                  Informations de prix
                </h5>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix d'achat:</span>
                  <span className="font-medium">{selectedProduit.prixAchat} GNF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix de vente:</span>
                  <span className="font-medium">{selectedProduit.prixVente} GNF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marge:</span>
                  <span className="font-medium text-green-600">
                    {(selectedProduit.prixVente - selectedProduit.prixAchat).toFixed(2)} GNF
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  Dates importantes
                </h5>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date d'ajout:</span>
                  <span className="font-medium">{new Date(selectedProduit.date_ajout).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date d'expiration:</span>
                  <span className={`font-medium ${
                    new Date(selectedProduit.date_expiration) < new Date() ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {new Date(selectedProduit.date_expiration).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de modification */}
      <Modal isOpen={modalType === "modifier"} onClose={closeModal} title="Modifier le produit" size="md">
        {selectedProduit && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input
                  type="number"
                  name="quantite"
                  value={editData.quantite || ""}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat (GNF)</label>
                <input
                  type="number"
                  name="prixAchat"
                  step="0.01"
                  value={editData.prixAchat || ""}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (GNF)</label>
                <input
                  type="number"
                  name="prixVente"
                  step="0.01"
                  value={editData.prixVente || ""}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock minimum</label>
                <input
                  type="number"
                  name="stock_min"
                  value={editData.stock_min || ""}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'ajout</label>
                <input
                  type="date"
                  name="date_ajout"
                  value={editData.date_ajout || ""}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                <input
                  type="date"
                  name="date_expiration"
                  value={editData.date_expiration || ""}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ListeProduits;