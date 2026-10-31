// @ts-nocheck
import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { 
  Eye, Edit, Trash2, Search, Filter, Download, 
  ChevronDown, X, AlertCircle, User, Mail, 
  Phone, Shield, CheckCircle, XCircle, Calendar,
  UserPlus, RefreshCw, Image, ImageOff, Clock, 
  UserCheck, UserX, Lock, Unlock, Sparkles, BookOpen, GraduationCap, Calculator
} from "lucide-react";
import api from "../../../config/axiosConfig";

// 🔹 Modal de confirmation personnalisé (élégant)
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = "warning" }) => {
  if (!isOpen) return null;
  
  const getTypeStyles = () => {
    switch(type) {
      case "danger":
        return { bg: "bg-red-50", border: "border-red-500", icon: <XCircle size={24} className="text-red-500" />, btn: "bg-red-500 hover:bg-red-600" };
      case "warning":
        return { bg: "bg-amber-50", border: "border-amber-500", icon: <AlertCircle size={24} className="text-amber-500" />, btn: "bg-amber-500 hover:bg-amber-600" };
      default:
        return { bg: "bg-blue-50", border: "border-blue-500", icon: <CheckCircle size={24} className="text-blue-500" />, btn: "bg-blue-500 hover:bg-blue-600" };
    }
  };
  
  const styles = getTypeStyles();
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className={`${styles.bg} p-6 border-b ${styles.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-full shadow-md">
              {styles.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-xl ${styles.btn} transition-all duration-200 shadow-md hover:shadow-lg`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔹 Notification Élégante Premium
const ElegantNotification = ({ type, message, onClose, title }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

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
          icon: <Clock size={24} className="text-white" />,
        };
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
          icon: <UserCheck size={24} className="text-white" />,
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
              {title || (type === "success" ? "Succès" : type === "warning" ? "Attention" : type === "info" ? "Information" : "Erreur")}
            </h4>
            <p className="text-white/90 text-sm mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
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

// 🔹 Modal Premium avec animations
const Modal = ({ isOpen, onClose, children, title, size = "md" }) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300 animate-fade-in">
      <div 
        className={`bg-white rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300 animate-scale-in`}
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
const SkeletonRow = () => (
  <div className="flex items-center p-4 space-x-4 border-b border-gray-100 animate-pulse">
    <div className="h-10 w-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
    </div>
    <div className="h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
  </div>
);

// 🔹 Badge de rôle avec style premium — ✅ MIS À JOUR
const RoleBadge = ({ role }) => {
  const getRoleConfig = (role) => {
    switch (role) {
      case 'superAdmin':
        return { color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm', icon: <Shield size={12} />, label: 'Super Admin' };
      case 'admin':
        return { color: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm', icon: <Shield size={12} />, label: 'Administrateur' };
      case 'Enseignant':
        return { color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm', icon: <BookOpen size={12} />, label: 'Enseignant' };
      case 'Etudiant':
        return { color: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm', icon: <GraduationCap size={12} />, label: 'Étudiant' };
      case 'Tuteur':
        return { color: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm', icon: <UserCheck size={12} />, label: 'Tuteur' };
      case 'Comptable':
        return { color: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm', icon: <Calculator size={12} />, label: 'Comptable' };
      case 'visiteur':
      default:
        return { color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm', icon: <User size={12} />, label: 'Visiteur' };
    }
  };

  const config = getRoleConfig(role);

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} border-0 flex items-center gap-1 shadow-md`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// 🔹 Badge de statut premium
const StatusBadge = ({ actif }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm ${
      actif 
        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200' 
        : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200'
    }`}>
      {actif ? <Sparkles size={10} className="text-emerald-500" /> : <Clock size={10} className="text-amber-500" />}
      {actif ? 'Actif' : 'En attente'}
    </span>
  );
};

// 🔹 Composant d'image avec gestion d'erreur améliorée
const UserAvatar = ({ photo, nomComplet, className = "w-12 h-12" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const isValidImageUrl = (url) => {
    return url && typeof url === 'string' && url.startsWith('/uploads/');
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (imageError || !isValidImageUrl(photo)) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-md border border-gray-100`}>
        <User size={20} className="text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {imageLoading && (
        <div className={`${className} bg-gray-200 rounded-xl animate-pulse`}></div>
      )}
      <img
        src={`${import.meta.env.VITE_API_URL || 'http://localhost:4999'}${photo}`}
        alt={nomComplet || 'Utilisateur'}
        className={`${className} object-cover rounded-xl shadow-md border border-gray-100 ${imageLoading ? 'hidden' : 'block'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </>
  );
};

// Types pour les props
interface UserType {
  _id: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  genre?: string;
  role: string;
  photo?: string | null;
  createdAt?: string;
  actif?: boolean;
}

const ListUsers: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [modalType, setModalType] = useState<string>("");
  const [editData, setEditData] = useState<Partial<UserType>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [exporting, setExporting] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<UserType[]>([]);
  const [toggleCleared, setToggleCleared] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ show: boolean; type: string; message: string; title: string }>({ 
    show: false, 
    type: "", 
    message: "",
    title: ""
  });
  const [modalRole, setModalRole] = useState<{ isOpen: boolean; user: UserType | null }>({
    isOpen: false,
    user: null
  });
  
  // États pour les modals de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: string;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: () => {}
  });
  
  // État pour le rôle de l'utilisateur connecté
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('utilisateur');
    console.log("📦 Utilisateur stocké:", storedUser);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUserRole(user.role || 'admin');
        setCurrentUserId(user._id || '');
        console.log("👤 Rôle récupéré:", user.role);
      } catch (e) {
        console.error('Erreur parsing:', e);
        setCurrentUserRole('admin');
      }
    } else {
      console.log("⚠️ Aucun utilisateur, mode admin forcé");
      setCurrentUserRole('admin');
    }
    
    fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get("/api/utilisateur/getAllUtilisateurs");
      console.log("Réponse API:", response.data);
      
      const cleanedUsers = (response.data.utilisateur || []).map((user: UserType) => ({
        ...user,
        photo: user.photo && typeof user.photo === 'string' && user.photo.startsWith('/uploads/') ? user.photo : null,
        actif: user.actif !== undefined ? user.actif : true
      }));
      
      setUsers(cleanedUsers);
      setFilteredUsers(cleanedUsers);
    } catch (apiError) {
      console.error("Erreur API, mode démo:", apiError);
      // ✅ Rôles de démo mis à jour
      const mockUsers: UserType[] = [
        {
          _id: "1",
          nomComplet: "Admin System",
          email: "admin@example.com",
          telephone: "0123456789",
          genre: "Homme",
          role: "superAdmin",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: true
        },
        {
          _id: "2",
          nomComplet: "Jean Dupont",
          email: "jean.dupont@example.com",
          telephone: "0123456789",
          genre: "Homme",
          role: "admin",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: true
        },
        {
          _id: "3",
          nomComplet: "Marie Martin",
          email: "marie.martin@example.com",
          telephone: "0987654321",
          genre: "Femme",
          role: "Enseignant",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: true
        },
        {
          _id: "4",
          nomComplet: "Paul Leblanc",
          email: "paul.leblanc@example.com",
          telephone: "0654321098",
          genre: "Homme",
          role: "Etudiant",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: true
        },
        {
          _id: "5",
          nomComplet: "Alice Bernard",
          email: "alice.bernard@example.com",
          telephone: "0612345678",
          genre: "Femme",
          role: "Tuteur",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: true
        },
        {
          _id: "6",
          nomComplet: "Luc Moreau",
          email: "luc.moreau@example.com",
          telephone: "0698765432",
          genre: "Homme",
          role: "Comptable",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: false
        },
        {
          _id: "7",
          nomComplet: "Pierre Durand",
          email: "pierre.durand@example.com",
          telephone: "0654321098",
          genre: "Homme",
          role: "visiteur",
          photo: null,
          createdAt: new Date().toISOString(),
          actif: false
        }
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      showElegantNotification("info", "Mode démo", "Données fictives chargées");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des utilisateurs
  useEffect(() => {
    let results = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (user) => 
          user.nomComplet.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.telephone && user.telephone.toLowerCase().includes(term))
      );
    }
    
    if (filterRole !== "all") {
      results = results.filter(user => user.role === filterRole);
    }
    
    if (filterStatus !== "all") {
      results = results.filter(user => 
        filterStatus === "actif" ? user.actif === true : user.actif === false
      );
    }
    
    setFilteredUsers(results);
  }, [searchTerm, filterRole, filterStatus, users]);

  const showElegantNotification = (type: string, title: string, message: string): void => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "", title: "" });
    }, 4000);
  };

  // ✅ ACTIVER UN UTILISATEUR (sans confirmation)
  const handleActivate = async (id: string, nom: string): Promise<void> => {
    try {
      const response = await api.put(`/api/utilisateur/activerUtilisateur/${id}`);
      console.log("Réponse activation:", response.data);
      showElegantNotification("success", "✅ COMPTE ACTIVÉ", `Le compte de ${nom} a été activé avec succès`);
      fetchUsers();
    } catch (error) {
      console.error("Erreur activation:", error);
      showElegantNotification("error", "❌ ÉCHEC D'ACTIVATION", error.response?.data?.message || `Impossible d'activer le compte de ${nom}`);
    }
  };

  // ✅ DÉSACTIVER UN UTILISATEUR (avec modal de confirmation)
  const handleDesactivate = async (id: string, nom: string): Promise<void> => {
    setConfirmModal({
      isOpen: true,
      type: "warning",
      title: "Désactivation du compte",
      message: `Êtes-vous sûr de vouloir désactiver le compte de ${nom} ? L'utilisateur ne pourra plus se connecter.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.put(`/api/utilisateur/desactiverUtilisateur/${id}`);
          showElegantNotification("warning", "⚠️ COMPTE DÉSACTIVÉ", `Le compte de ${nom} a été désactivé`);
          fetchUsers();
        } catch (error) {
          console.error("Erreur désactivation:", error);
          showElegantNotification("error", "❌ ÉCHEC DE DÉSACTIVATION", error.response?.data?.message || `Impossible de désactiver le compte de ${nom}`);
        }
      }
    });
  };

  // ✅ MODIFIER LE RÔLE — mapping mis à jour
  const handleModifyRole = async (userId: string, nouveauRole: string, nom: string): Promise<void> => {
    try {
      console.log("🔄 Modification du rôle - ID:", userId, "Nouveau rôle:", nouveauRole);
      
      const response = await api.put(`/api/utilisateur/modifierRole/${userId}`, { role: nouveauRole });
      console.log("✅ Réponse modification rôle:", response.data);
      
      const roleNames = {
        'superAdmin': 'Super Admin',
        'admin': 'Administrateur',
        'Enseignant': 'Enseignant',
        'Etudiant': 'Étudiant',
        'Tuteur': 'Tuteur',
        'Comptable': 'Comptable',
        'visiteur': 'Visiteur'
      };
      const roleName = roleNames[nouveauRole] || nouveauRole;
      showElegantNotification("success", "🛡️ RÔLE MODIFIÉ", `${nom} est maintenant ${roleName}`);
      
      setModalRole({ isOpen: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error("❌ Erreur modification rôle:", error);
      showElegantNotification("error", "❌ ÉCHEC DE MODIFICATION", error.response?.data?.message || `Impossible de modifier le rôle de ${nom}`);
    }
  };

  // ✅ SUPPRIMER UN UTILISATEUR (avec modal de confirmation)
  const handleDelete = async (id: string, nom: string): Promise<void> => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Suppression définitive",
      message: `Êtes-vous sûr de vouloir supprimer définitivement ${nom} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/api/utilisateur/supprimerUnUtilisateur/${id}`);
          setUsers(users.filter((user) => user._id !== id));
          showElegantNotification("success", "🗑️ UTILISATEUR SUPPRIMÉ", `${nom} a été supprimé`);
        } catch (error) {
          console.error("Erreur suppression:", error);
          showElegantNotification("error", "❌ ÉCHEC DE SUPPRESSION", error.response?.data?.message || `Impossible de supprimer ${nom}`);
        }
      }
    });
  };

  // ✅ SUPPRESSION GROUPÉE (avec modal de confirmation)
  const handleBulkDelete = async (): Promise<void> => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Suppression groupée",
      message: `Êtes-vous sûr de vouloir supprimer définitivement ${selectedRows.length} utilisateur(s) ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          for (const row of selectedRows) {
            await api.delete(`/api/utilisateur/supprimerUnUtilisateur/${row._id}`);
          }
          setUsers(users.filter((user) => !selectedRows.some(r => r._id === user._id)));
          setSelectedRows([]);
          setToggleCleared(!toggleCleared);
          showElegantNotification("success", "🗑️ SUPPRESSION GROUPÉE", `${selectedRows.length} utilisateur(s) supprimés`);
        } catch (error) {
          console.error("Erreur suppression multiple:", error);
          showElegantNotification("error", "❌ ÉCHEC DE SUPPRESSION", "Suppression impossible");
        }
      }
    });
  };

  // ✅ MODIFIER UTILISATEUR
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const res = await api.put(
        `/api/utilisateur/modifierUnUtilisateur/${selectedUser?._id}`,
        editData
      );
      setUsers(
        users.map((user) => (user._id === selectedUser?._id ? res.data.utilisateur : user))
      );
      closeModal();
      showElegantNotification("success", "✏️ UTILISATEUR MODIFIÉ", `${selectedUser?.nomComplet} a été mis à jour`);
    } catch (error) {
      console.error("Erreur modification:", error);
      showElegantNotification("error", "❌ ÉCHEC DE MODIFICATION", error.response?.data?.message || "Modification impossible");
    }
  };

  // ✅ EXPORT — labels mis à jour
  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const roleLabels = {
        'superAdmin': 'Super Admin',
        'admin': 'Administrateur',
        'Enseignant': 'Enseignant',
        'Etudiant': 'Étudiant',
        'Tuteur': 'Tuteur',
        'Comptable': 'Comptable',
        'visiteur': 'Visiteur'
      };
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Nom Complet,Email,Téléphone,Genre,Rôle,Statut,Date Création\n"
        + users.map(user => 
            `"${user.nomComplet}","${user.email}","${user.telephone || 'Non renseigné'}","${user.genre || 'Non spécifié'}","${roleLabels[user.role] || user.role}","${user.actif ? 'Actif' : 'En attente'}","${new Date(user.createdAt || Date.now()).toLocaleDateString()}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "utilisateurs_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showElegantNotification("success", "📥 EXPORT RÉUSSI", `${users.length} utilisateurs exportés`);
    } catch (error) {
      console.error("Erreur export:", error);
      showElegantNotification("error", "❌ ÉCHEC D'EXPORT", "Export impossible");
    }
    setExporting(false);
  };

  const openModal = (user: UserType, type: string): void => {
    setSelectedUser(user);
    setModalType(type);
    if (type === "modifier") {
      setEditData({
        nomComplet: user.nomComplet,
        email: user.email,
        telephone: user.telephone,
        genre: user.genre,
        role: user.role,
      });
    }
  };

  const closeModal = (): void => {
    setSelectedUser(null);
    setModalType("");
    setEditData({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRowSelected = React.useCallback((state: { selectedRows: UserType[] }) => {
    setSelectedRows(state.selectedRows);
  }, []);

  const contextActions = React.useMemo(() => {
    if (selectedRows.length === 0) return null;
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <span className="font-semibold">{selectedRows.length} sélectionné(s)</span>
        <button 
          onClick={handleBulkDelete}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    );
  }, [selectedRows]);

  const isSuperAdmin = () => {
    return currentUserRole === 'superAdmin';
  };

  // ✅ Statistiques mises à jour
  const stats = {
    total: users.length,
    actifs: users.filter(u => u.actif === true).length,
    inactifs: users.filter(u => u.actif === false).length,
    superAdmin: users.filter(u => u.role === 'superAdmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    enseignant: users.filter(u => u.role === 'Enseignant').length,
    etudiant: users.filter(u => u.role === 'Etudiant').length,
    tuteur: users.filter(u => u.role === 'Tuteur').length,
    comptable: users.filter(u => u.role === 'Comptable').length,
    visiteur: users.filter(u => u.role === 'visiteur').length
  };

  // Colonnes
  const columns = [
    {
      name: "Utilisateur",
      cell: (row: UserType) => (
        <div className="flex items-center">
          <UserAvatar photo={row.photo} nomComplet={row.nomComplet} className="w-12 h-12" />
          <div className="ml-3">
            <div className="font-semibold text-gray-900">{row.nomComplet}</div>
            <div className="text-xs text-gray-500 capitalize">{row.genre || 'Non spécifié'}</div>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: "250px",
      grow: 2,
    },
    {
      name: "Contact",
      cell: (row: UserType) => (
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium flex items-center gap-1">
            <Mail size={14} className="text-blue-500" />
            {row.email}
          </span>
          {row.telephone && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Phone size={12} className="text-green-500" />
              {row.telephone}
            </span>
          )}
        </div>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Rôle",
      cell: (row: UserType) => <RoleBadge role={row.role} />,
      sortable: true,
      width: "150px",
      center: true,
    },
    {
      name: "Statut",
      cell: (row: UserType) => <StatusBadge actif={row.actif} />,
      sortable: true,
      width: "110px",
      center: true,
    },
    {
      name: "Date création",
      cell: (row: UserType) => (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar size={12} className="text-gray-400" />
          {new Date(row.createdAt || Date.now()).toLocaleDateString()}
        </div>
      ),
      sortable: true,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row: UserType) => (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openModal(row, "afficher")}
            className="group p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-105"
            title="Voir détails"
          >
            <Eye size={16} />
          </button>
          
          <button
            onClick={() => openModal(row, "modifier")}
            className="group p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200 hover:scale-105"
            title="Modifier l'utilisateur"
          >
            <Edit size={16} />
          </button>
          
          {!row.actif && (
            <button
              onClick={() => handleActivate(row._id, row.nomComplet)}
              className="group p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 hover:scale-105"
              title="Activer le compte"
            >
              <Unlock size={16} />
            </button>
          )}
          
          {row.actif && row._id !== currentUserId && (
            <button
              onClick={() => handleDesactivate(row._id, row.nomComplet)}
              className="group p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all duration-200 hover:scale-105"
              title="Désactiver le compte"
            >
              <Lock size={16} />
            </button>
          )}
          
          <button
            onClick={() => {
              console.log("📝 Ouverture modal pour:", row.nomComplet);
              setModalRole({ isOpen: true, user: row });
            }}
            className="group p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-200 hover:scale-105"
            title="Modifier le rôle"
          >
            <Shield size={16} />
          </button>
          
          {row._id !== currentUserId && (
            <button
              onClick={() => handleDelete(row._id, row.nomComplet)}
              className="group p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 hover:scale-105"
              title="Supprimer l'utilisateur"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "420px",
    },
  ];

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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-8 border border-gray-100">
      {/* Modal de confirmation personnalisé */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
      />

      {notification.show && (
        <ElegantNotification 
          type={notification.type} 
          title={notification.title}
          message={notification.message} 
          onClose={() => setNotification({ show: false, type: "", message: "", title: "" })} 
        />
      )}

      {/* ✅ Header statistiques — 6 cartes avec les nouveaux rôles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-blue-800">{stats.total}</h3>
              <p className="text-sm text-blue-600">Total</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <User className="text-blue-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-green-800">{stats.actifs}</h3>
              <p className="text-sm text-green-600">Actifs</p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <UserCheck className="text-green-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-amber-800">{stats.inactifs}</h3>
              <p className="text-sm text-amber-600">En attente</p>
            </div>
            <div className="p-3 bg-amber-200 rounded-full">
              <Clock className="text-amber-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-emerald-800">{stats.etudiant}</h3>
              <p className="text-sm text-emerald-600">Étudiants</p>
            </div>
            <div className="p-3 bg-emerald-200 rounded-full">
              <GraduationCap className="text-emerald-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-indigo-800">{stats.enseignant}</h3>
              <p className="text-sm text-indigo-600">Enseignants</p>
            </div>
            <div className="p-3 bg-indigo-200 rounded-full">
              <BookOpen className="text-indigo-700" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-purple-800">{stats.superAdmin + stats.admin}</h3>
              <p className="text-sm text-purple-600">Admins</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <Shield className="text-purple-700" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
          Gestion des Utilisateurs
          <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredUsers.length} utilisateurs
          </span>
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full shadow-sm"
            />
          </div>
          
          {/* ✅ Filtre rôle mis à jour */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm"
            >
              <option value="all">Tous les rôles</option>
              <option value="superAdmin">Super Admin</option>
              <option value="admin">Administrateur</option>
              <option value="Etudiant">Étudiant</option>
              <option value="Enseignant">Enseignant</option>
              <option value="Tuteur">Tuteur</option>
              <option value="Comptable">Comptable</option>
              <option value="visiteur">Visiteur</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">En attente</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
          
          <button
            onClick={handleExport}
            disabled={exporting || users.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
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
        data={filteredUsers}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[5, 10, 20, 50]}
        highlightOnHover
        pointerOnHover
        responsive
        selectableRows={true}
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
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        }
      />

      {/* Modal d'affichage */}
      <Modal isOpen={modalType === "afficher"} onClose={closeModal} title="Détails de l'utilisateur" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <UserAvatar photo={selectedUser.photo} nomComplet={selectedUser.nomComplet} className="w-40 h-40" />
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.nomComplet}</h4>
                <p className="text-gray-600 mb-4">{selectedUser.email}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge actif={selectedUser.actif} />
                  <span className="text-sm text-gray-500 capitalize">{selectedUser.genre || 'Non spécifié'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-700 flex items-center gap-2"><User size={18} className="text-blue-500" /> Infos personnelles</h5>
                <div className="flex justify-between"><span className="text-gray-600">Nom:</span><span className="font-medium">{selectedUser.nomComplet}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Genre:</span><span className="font-medium capitalize">{selectedUser.genre || 'Non spécifié'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Rôle:</span><RoleBadge role={selectedUser.role} /></div>
                <div className="flex justify-between"><span className="text-gray-600">Statut:</span><StatusBadge actif={selectedUser.actif} /></div>
              </div>
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-700 flex items-center gap-2"><Mail size={18} className="text-green-500" /> Coordonnées</h5>
                <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-medium">{selectedUser.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Téléphone:</span><span className="font-medium">{selectedUser.telephone || 'Non renseigné'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Date création:</span><span className="font-medium">{new Date(selectedUser.createdAt || Date.now()).toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ✅ Modal de modification — liste rôles mise à jour */}
      <Modal isOpen={modalType === "modifier"} onClose={closeModal} title="Modifier l'utilisateur" size="md">
        {selectedUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input type="text" name="nomComplet" value={editData.nomComplet || ''} onChange={handleEditChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={editData.email || ''} onChange={handleEditChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" name="telephone" value={editData.telephone || ''} onChange={handleEditChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select name="genre" value={editData.genre || ''} onChange={handleEditChange} className="w-full p-3 border border-gray-200 rounded-xl">
                  <option value="">Sélectionnez</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select name="role" value={editData.role || ''} onChange={handleEditChange} className="w-full p-3 border border-gray-200 rounded-xl" required>
                  <option value="visiteur">Visiteur</option>
                  <option value="Etudiant">Étudiant</option>
                  <option value="Enseignant">Enseignant</option>
                  <option value="Tuteur">Tuteur</option>
                  <option value="Comptable">Comptable</option>
                  <option value="admin">Administrateur</option>
                  {isSuperAdmin() && <option value="superAdmin">Super Admin</option>}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700">Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ✅ Modal modification rôle — liste mise à jour */}
      <Modal isOpen={modalRole.isOpen} onClose={() => setModalRole({ isOpen: false, user: null })} title="Modifier le rôle" size="sm">
        {modalRole.user && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Shield size={32} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{modalRole.user.nomComplet}</h3>
              <p className="text-sm text-gray-500">{modalRole.user.email}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-600 mb-2">Rôle actuel:</p>
              <div className="mb-4">
                <RoleBadge role={modalRole.user.role} />
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau rôle</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                defaultValue={modalRole.user.role}
                onChange={(e) => {
                  const nouveauRole = e.target.value;
                  console.log("📌 Nouveau rôle sélectionné:", nouveauRole);
                  handleModifyRole(modalRole.user!._id, nouveauRole, modalRole.user!.nomComplet);
                }}
              >
                <option value="visiteur">👤 Visiteur</option>
                <option value="Etudiant">🎓 Étudiant</option>
                <option value="Enseignant">📚 Enseignant</option>
                <option value="Tuteur">🤝 Tuteur</option>
                <option value="Comptable">💰 Comptable</option>
                <option value="admin">🛡️ Administrateur</option>
                {isSuperAdmin() && <option value="superAdmin">⭐ Super Admin</option>}
              </select>
              
              <p className="text-xs text-gray-400 mt-2">
                💡 Le changement de rôle est immédiat
              </p>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes progressBar { from { width: 100%; } to { width: 0%; } }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out; }
        .animate-progress-bar { animation: progressBar 3.8s linear forwards; }
      `}</style>
    </div>
  );
};

export default ListUsers;