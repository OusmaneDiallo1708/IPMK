// @ts-nocheck
import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Eye, Edit, Trash2, Search, Download, ChevronDown, X, AlertCircle, Tag, Plus, Filter, CheckCircle, XCircle } from "lucide-react";
import BtnCategorie from "./BtnCategorie";
import api from "../../config/axiosConfig"; // 👈 IMPORT DE L'INSTANCE AXIOS

// Types pour les notifications
interface NotificationProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

// Types pour le modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
}

// Types pour une catégorie
interface Categorie {
  _id: string;
  nom: string;
  description: string;
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

interface NotificationState {
  show: boolean;
  type: "success" | "error";
  message: string;
}

interface ApiResponse {
  categorie: Categorie[];
  message?: string;
}

const CategorieListes: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategorie, setSelectedCategorie] = useState<Categorie | null>(null);
  const [modalType, setModalType] = useState<string>("");
  const [editData, setEditData] = useState<{ nom: string; description: string }>({ nom: "", description: "" });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Categorie[]>([]);
  const [toggleCleared, setToggleCleared] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "success", message: "" });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        // ✅ UTILISATION DE L'INSTANCE api
        const res = await api.get<ApiResponse>("/api/allroute/getAllCategorie");
        setCategories(res.data.categorie || []);
        setFilteredCategories(res.data.categorie || []);
        setLoading(false);
      } catch (error) {
        console.error("Erreur récupération categories :", error);
        setLoading(false);
        showNotification("error", "Erreur lors du chargement des catégories");
      }
    };
    fetchCategories();
  }, []);

  // Filtrage des catégories
  useEffect(() => {
    let results = categories;
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (c) => 
          c.nom.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredCategories(results);
  }, [searchTerm, categories]);

  const showNotification = (type: "success" | "error", message: string): void => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "success", message: "" });
    }, 3000);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;

    try {
      setActionLoading(true);
      // ✅ UTILISATION DE L'INSTANCE api
      const response = await api.delete<{ message: string }>(
        `/api/allroute/deleteCategorie/${id}`
      );

      setCategories((prev) => prev.filter((c) => c._id !== id));
      setFilteredCategories((prev) => prev.filter((c) => c._id !== id));
      showNotification("success", response.data.message || "Catégorie supprimée avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la suppression :", error);
      showNotification("error", error.response?.data?.message || "Impossible de supprimer la catégorie.");
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleBulkDelete = async (): Promise<void> => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRows.length} catégories ?`)) return;

    try {
      setActionLoading(true);
      const deletePromises = selectedRows.map((row) =>
        api.delete(`/api/allroute/deleteCategorie/${row._id}`)
      );

      await Promise.all(deletePromises);
      setCategories(categories.filter((c) => !selectedRows.some((r) => r._id === c._id)));
      setFilteredCategories(filteredCategories.filter((c) => !selectedRows.some((r) => r._id === c._id)));
      setSelectedRows([]);
      setToggleCleared(!toggleCleared);

      showNotification("success", `${selectedRows.length} catégorie(s) supprimée(s) avec succès !`);
    } catch (error: any) {
      console.error("Erreur suppression multiple :", error);
      showNotification("error", error.response?.data?.message || "Impossible de supprimer les catégories sélectionnées.");
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (categorie: Categorie, type: string): void => {
    setSelectedCategorie(categorie);
    setModalType(type);
    if (type === "modifier") {
      setEditData({
        nom: categorie.nom,
        description: categorie.description,
      });
    }
  };

  const closeModal = (): void => {
    setSelectedCategorie(null);
    setModalType("");
    setEditData({ nom: "", description: "" });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setActionLoading(true);
      // ✅ UTILISATION DE L'INSTANCE api
      const res = await api.put<{ categorie: Categorie }>(
        `/api/allroute/updateCategorie/${selectedCategorie?._id}`,
        editData
      );
      setCategories(
        categories.map((c) => (c._id === selectedCategorie?._id ? res.data.categorie : c))
      );
      setFilteredCategories(
        filteredCategories.map((c) => (c._id === selectedCategorie?._id ? res.data.categorie : c))
      );
      closeModal();
      showNotification("success", "Catégorie modifiée avec succès !");
    } catch (error) {
      console.error("Erreur modification :", error);
      showNotification("error", "Impossible de modifier la catégorie.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Nom,Description\n"
        + categories.map(c => 
            `"${c.nom}","${c.description}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "categories_export.csv");
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

  const handleRowSelected = React.useCallback((state: { selectedRows: Categorie[] }) => {
    setSelectedRows(state.selectedRows);
  }, []);

  const contextActions = React.useMemo(() => {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg">
        <span>{selectedRows.length} catégorie(s) sélectionnée(s)</span>
        <button 
          onClick={handleBulkDelete}
          disabled={actionLoading}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    );
  }, [selectedRows, actionLoading]);

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
      name: "Catégorie",
      selector: (row: Categorie) => (
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3 shadow-sm border border-gray-200">
            <Tag size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.nom}</div>
            <div className="text-xs text-gray-500 truncate max-w-xs">{row.description}</div>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: "280px",
      grow: 2,
    },
    {
      name: "Actions",
      cell: (row: Categorie) => (
        <div className="flex gap-2">
          <button
            onClick={() => openModal(row, "afficher")}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1"
            title="Voir détails"
          >
            <Eye size={16} />
            <span className="text-xs">Détails</span>
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
            disabled={actionLoading}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 disabled:opacity-50"
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

  // Statistiques pour le header
  const stats = {
    total: categories.length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-8 border border-gray-100">
      {notification.show && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification({ show: false, type: "success", message: "" })} 
        />
      )}

      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-blue-800">{stats.total}</h3>
              <p className="text-sm text-blue-600">Total Catégories</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <Tag className="text-blue-700" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
          Inventaire des Catégories
          <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredCategories.length} catégories
          </span>
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full shadow-sm"
            />
          </div>
          
          <button
            onClick={handleExport}
            disabled={exporting || categories.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download size={16} />
            )}
            Exporter
          </button>

          <BtnCategorie />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
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
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune catégorie trouvée</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        }
      />

      {/* Modal d'affichage */}
      <Modal isOpen={modalType === "afficher"} onClose={closeModal} title="Détails de la catégorie" size="md">
        {selectedCategorie && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-md border border-gray-200">
                <Tag size={40} className="text-blue-600" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedCategorie.nom}</h4>
                <p className="text-gray-600 mb-4">{selectedCategorie.description}</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-100">
              <h5 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Tag size={18} className="text-blue-500" />
                Informations de la catégorie
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">{selectedCategorie.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium">{selectedCategorie.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium text-xs">{selectedCategorie._id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de modification */}
      <Modal isOpen={modalType === "modifier"} onClose={closeModal} title="Modifier la catégorie" size="sm">
        {selectedCategorie && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                name="nom"
                value={editData.nom || ""}
                onChange={handleEditChange}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom de la catégorie"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={editData.description || ""}
                onChange={handleEditChange}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description de la catégorie"
                rows={3}
                required
              />
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
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {actionLoading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CategorieListes;