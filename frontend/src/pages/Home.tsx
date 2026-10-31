// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  AlertCircle, LogOut, Menu, 
  X, Bell, User, Search, Users, 
  CheckCircle, Clock, RefreshCw,
  ChevronDown, ChevronRight, Banknote, GraduationCap, Calculator,
  Award, FileSpreadsheet, ShieldAlert, Lock
} from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../components/log/context/UserContext";
import { useNavigate } from "react-router-dom";
import Dashboard from "./dashbord/Dashbord";
import Comptabilite from "./comptabilite/Comptabilite";
import ListeEtudiants from "./etudiants/ListeEtudiants";
import ListeEnseignants from "./enseignants/ListeEnseignants";
import ListeNotes from "./notes/ListeNotes";
import Bulletin from "./notes/Bulletin";
import Deconnexion from "../components/log/logout/Deconnexion";
import AddUsers from "../components/log/admin/AddUsers";
import CaisseForm from "./caisse/CaisseForm";
import GestionDemandesCaisse from '../components/log/admin/GestionDemandesCaisse';
import { PiStudent } from "react-icons/pi";
import api from "../config/axiosConfig";

// ==================== TYPES ====================
interface Notification {
  id: string;
  type: "alert" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  targetPage?: string;
}

interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

// ==================== 🔐 CONFIGURATION DES ACCÈS PAR RÔLE ====================
const ROLE_PAGES_ACCESS: Record<string, string[]> = {
  'superAdmin': ['dashbord', 'etudiants', 'enseignants', 'notes', 'bulletin', 'comptabilite', 'user'],
  'admin':      ['dashbord', 'etudiants', 'enseignants', 'notes', 'bulletin', 'comptabilite', 'user'],
  'Comptable':  ['comptabilite', 'etudiants'], // ✅ Comptabilité + Étudiants
  'Enseignant': ['notes'],
  'Tuteur':     ['notes'],
  'Etudiant':   ['notes'],
  'visiteur':   [],
};

const DEFAULT_PAGE_BY_ROLE: Record<string, string> = {
  'superAdmin': 'dashbord',
  'admin':      'dashbord',
  'Comptable':  'comptabilite', // ✅ Arrive sur la compta
  'Enseignant': 'notes',
  'Tuteur':     'notes',
  'Etudiant':   'notes',
  'visiteur':   'waiting',
};

// ==================== 🚫 PAGE D'ATTENTE ====================
const WaitingPage = ({ role }: { role: string }) => (
  <div className="flex items-center justify-center min-h-[70vh] p-6">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100">
      <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Lock size={40} className="text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès restreint</h2>
      <p className="text-gray-600 mb-4">
        {role === 'visiteur'
          ? "Votre compte est actif, mais aucun module ne vous est encore attribué. Contactez l'administrateur."
          : `Votre rôle (${role}) n'a pas accès à cette section.`}
      </p>
      <p className="text-xs text-gray-400">
        Rôles avec accès complet : superAdmin, admin
      </p>
    </div>
  </div>
);

const Home: React.FC = () => {
  const { user, logout, setUser } = useUser();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>("dashbord");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userRole, setUserRole] = useState<string>('visiteur');
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isUserSubMenuOpen, setIsUserSubMenuOpen] = useState<boolean>(true);

  const isCheckingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Récupère le rôle depuis localStorage
  const getCurrentUserRole = () => {
    try {
      const storedUser = localStorage.getItem('utilisateur');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData.role || 'visiteur';
      }
    } catch (e) {
      console.error('Erreur récupération rôle:', e);
    }
    return 'visiteur';
  };

  // ✅ Vérification session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('utilisateur');

    console.log("🔍 Vérification session - Token:", token ? "✅ présent" : "❌ absent");
    console.log("🔍 Vérification session - Utilisateur:", storedUser ? "✅ présent" : "❌ absent");

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const role = userData.role || 'visiteur';
        setUserRole(role);
        setUser(userData);
        console.log("✅ Utilisateur connecté:", userData.email, "Rôle:", role);

        // ✅ Rediriger vers la page par défaut du rôle
        setActivePage(DEFAULT_PAGE_BY_ROLE[role] || 'waiting');
        setIsCheckingAuth(false);
      } catch (e) {
        console.error('Erreur parsing utilisateur:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');
        navigate('/profil');
      }
    } else if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const role = userData.role || 'visiteur';
        setUserRole(role);
        setUser(userData);
        setActivePage(DEFAULT_PAGE_BY_ROLE[role] || 'waiting');
        setIsCheckingAuth(false);
      } catch (e) {
        console.error('Erreur parsing utilisateur:', e);
        navigate('/profil');
      }
    } else {
      console.log("❌ Aucune session trouvée, redirection vers login");
      navigate('/profil');
    }
  }, [navigate, setUser]);

  // ✅ Alerte : étudiants en attente (uniquement pour admin/superAdmin)
  const checkAlerts = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      if (userRole === 'admin' || userRole === 'superAdmin') {
        try {
          const response = await api.get('/api/allroute/etudiant/en-attente');
          const pendingEtudiants = response.data?.etudiants;

          if (pendingEtudiants && Array.isArray(pendingEtudiants) && pendingEtudiants.length > 0) {
            setNotifications(prev => {
              const exists = prev.some(n => n.id === 'pending-etudiants');
              if (!exists) {
                return [{
                  id: 'pending-etudiants',
                  type: 'alert',
                  title: '🎓 Étudiants en attente',
                  message: `${pendingEtudiants.length} étudiant(s) en attente d'activation`,
                  time: new Date().toISOString(),
                  read: false,
                  targetPage: 'etudiants'
                }, ...prev.filter(n => n.id !== 'pending-etudiants')];
              }
              return prev;
            });
          } else {
            setNotifications(prev => prev.filter(n => n.id !== 'pending-etudiants'));
          }
        } catch (error) {
          console.error('Erreur chargement étudiants en attente:', error);
        }
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [userRole]);

  useEffect(() => {
    if (!isCheckingAuth) {
      checkAlerts();
      intervalRef.current = setInterval(checkAlerts, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isCheckingAuth, checkAlerts]);

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setShowNotifications(false);

    if (notification.targetPage) {
      setActivePage(notification.targetPage);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
  };

  const toggleUserSubMenu = () => setIsUserSubMenuOpen(!isUserSubMenuOpen);

  const currentRole = getCurrentUserRole();
  const isAdmin = currentRole === 'admin' || currentRole === 'superAdmin';
  const allowedPages = ROLE_PAGES_ACCESS[currentRole] || [];

  // ==================== 📋 MENU PAR RÔLE ====================
  const allSidebarItems: SidebarItem[] = [
    { id: "dashbord",     icon: GraduationCap,   label: "Tableau de Bord" },
    { id: "etudiants",    icon: PiStudent,       label: "Étudiants" },
    { id: "enseignants",  icon: GraduationCap,   label: "Enseignants" },
    { id: "notes",        icon: Award,           label: "Notes" },
    { id: "bulletin",     icon: FileSpreadsheet, label: "Bulletins" },
    { id: "comptabilite", icon: Banknote,        label: "Comptabilité" },
  ];

  // ✅ Filtre : on ne garde que les items autorisés pour le rôle
  const sidebarItems = allSidebarItems.filter(item => allowedPages.includes(item.id));

  // Sous-menus Admin (uniquement pour admin/superAdmin)
  const adminSubItems: SidebarItem[] = [
    { id: "user", icon: Users, label: "Utilisateurs" },
  ];

  const handleLogout = async (): Promise<void> => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // ✅ Titre dynamique du header
  const getPageTitle = (): string => {
    const pageMap: Record<string, string> = {
      'dashbord':       'Tableau de Bord',
      'etudiants':      'Étudiants',
      'enseignants':    'Enseignants',
      'notes':          'Notes',
      'bulletin':       'Bulletins',
      'comptabilite':   'Comptabilité',
      'caisse':         'Caisses',
      'demandesCaisse': 'Demandes de Caisse',
      'user':           'Utilisateurs',
      'waiting':        'Accès restreint',
    };
    return pageMap[activePage] || 'Tableau de Bord';
  };

  // ==================== 🎨 RENDER PAGE PRINCIPALE ====================
  const renderMainContent = () => {
    // Sécurité : si la page n'est pas autorisée pour ce rôle → WaitingPage
    if (!allowedPages.includes(activePage)) {
      return <WaitingPage role={currentRole} />;
    }

    switch (activePage) {
      case 'dashbord':     return <Dashboard />;
      case 'etudiants':    return <ListeEtudiants />;
      case 'enseignants':  return <ListeEnseignants />;

      // ✅ ListeNotes reçoit le rôle + userId pour filtrage côté backend
      case 'notes':        return <ListeNotes userRole={currentRole} userId={user?._id} />;
      case 'bulletin':     return <Bulletin userRole={currentRole} userId={user?._id} />;

      case 'comptabilite': return <Comptabilite />;
      case 'caisse':       return <CaisseForm />;
      case 'user':         return <AddUsers />;
      case 'logout':       return <Deconnexion />;
      case 'demandesCaisse': return <GestionDemandesCaisse />;

      case 'waiting':      return <WaitingPage role={currentRole} />;
      default:             return <WaitingPage role={currentRole} />;
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 transform transition-transform z-40 overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <nav className="h-full bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl border-r border-blue-700 flex flex-col">
          <div className="flex justify-center items-center p-6 border-b border-blue-700 flex-shrink-0">
            <div className="flex items-center">
              <div
                className="w-[7vh] h-[7vh] rounded-full cursor-pointer transition-transform hover:scale-105 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
                onClick={() => setActivePage(DEFAULT_PAGE_BY_ROLE[currentRole] || 'waiting')}
              >
                <img src="/images/Touramancy.jpeg" alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">I.P.M.K</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-4 w-full text-left p-4 rounded-xl transition-all duration-300
                    ${activePage === item.id
                      ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Icon size={28} className={activePage === item.id ? "text-white" : "text-blue-300"} />
                  <span className="text-xl font-semibold">{item.label}</span>
                  {activePage === item.id && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
                </button>
              );
            })}

            {isAdmin && allowedPages.includes('user') && (
              <div>
                <button
                  onClick={toggleUserSubMenu}
                  className="flex items-center justify-between w-full text-left p-4 rounded-xl transition-all duration-300 text-blue-100 hover:bg-white/10 hover:text-white"
                >
                  <div className="flex items-center gap-4">
                    <Users size={28} className="text-blue-300" />
                    <span className="text-xl font-semibold">Administration</span>
                  </div>
                  {isUserSubMenuOpen ? <ChevronDown size={20} className="text-blue-300" /> : <ChevronRight size={20} className="text-blue-300" />}
                </button>

                {isUserSubMenuOpen && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-blue-600 pl-4">
                    {adminSubItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActivePage(item.id);
                            setIsOpen(false);
                          }}
                          className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-all duration-300
                            ${activePage === item.id
                              ? "bg-white/20 backdrop-blur-sm text-white shadow-lg"
                              : "text-blue-200 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          <Icon size={20} className={activePage === item.id ? "text-white" : "text-blue-300"} />
                          <span className="text-base font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-blue-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full p-4 rounded-xl text-red-100 hover:bg-red-600/20 hover:text-white transition-all duration-300"
            >
              <LogOut size={28} className="text-red-300" />
              <span className="text-xl font-semibold">Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ===== CONTENU ===== */}
      <div className="flex-1 flex flex-col lg:ml-80">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white shadow-lg px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="font-bold text-2xl text-blue-900">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-xl px-4 py-2">
              <Search size={20} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent border-none text-gray-700 placeholder-gray-500 focus:outline-none w-48"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors relative"
              >
                <Bell size={24} className="text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50"
                  >
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={18} className="text-blue-600" />
                          <h3 className="text-gray-800 font-semibold">Notifications</h3>
                          {unreadNotifications > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {unreadNotifications} non lue(s)
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700">
                            Tout marquer lu
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={40} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50/30' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                                notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {notification.type === 'alert' ? <AlertCircle size={16} /> :
                                 notification.type === 'success' ? <CheckCircle size={16} /> : <Clock size={16} />}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 text-sm font-medium">{notification.title}</p>
                                <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                                <p className="text-gray-400 text-xs mt-1">{formatTime(notification.time)}</p>
                              </div>
                              {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <button
                          onClick={() => setNotifications([])}
                          className="w-full text-center text-xs text-gray-500 hover:text-red-500 py-1"
                        >
                          Effacer toutes les notifications
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium hidden md:block">
                  {user?.nomComplet || user?.nom || "Admin"}
                </span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-gray-800 font-semibold">{user?.nomComplet || user?.nom || "Admin"}</p>
                      <p className="text-gray-500 text-sm">{user?.email || "admin@example.com"}</p>
                      <p className="text-xs text-blue-500 mt-1 capitalize">Rôle: {currentRole}</p>
                    </div>
                    <div className="p-2 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut size={18} />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ===== MAIN ===== */}
        <main className="flex-1 w-full min-h-screen overflow-y-auto bg-gray-50 p-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default Home;