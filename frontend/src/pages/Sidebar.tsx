// @ts-nocheck
import { useState } from "react";
import { 
  Menu, X, Package, ShoppingCart, Warehouse, Settings, 
  LayoutDashboard, Users, Gift, BarChart3, ChevronDown, ChevronRight, Banknote 
} from "lucide-react";

interface SidebarProps {
  onNavigate?: (page: string) => void;
  activePage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activePage = "dashboard" }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(true);

  const toggleSidebar = (): void => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = (): void => {
    setIsOpen(false);
  };

  const toggleUserMenu = (): void => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // ✅ Menu principal (visible pour tous)
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Tableau de Bord" },
    { id: "etudiants", icon: Package, label: "Etudiants" },
    { id: "stocks", icon: Warehouse, label: "Stocks" },
    { id: "ventes", icon: ShoppingCart, label: "Ventes" },
    { id: "caisse", icon: ShoppingCart, label: "Caisses" },
    { id: "monStock", icon: Package, label: "Mon Stock" }, // ✅ Déplacé ici (visible pour tous)
    { id: "settings", icon: Settings, label: "Paramètres" },
  ];

  // ✅ Sous-menus pour ADMIN seulement
  const adminSubMenu = [
    { id: "users", icon: Users, label: "Utilisateurs" },
    { id: "approvisionner", icon: Gift, label: "Approvisionner" },
    { id: "statsVentes", icon: BarChart3, label: "Stats Ventes" },
    { id: "demandesDepot", icon: Banknote, label: "Demandes Dépôt" },
  ];

  const handleNavigate = (pageId: string) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    closeSidebar();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Bouton hamburger mobile */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-900 text-white p-2 rounded-lg shadow-lg hover:bg-blue-800 transition-colors"
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl transform transition-transform duration-300 z-40 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo / Titre */}
        <div className="flex items-center justify-center p-6 border-b border-blue-700 flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">WS</span>
          </div>
          <span className="ml-3 text-xl font-bold text-white">IMPK</span>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Menu principal */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group
                  ${activePage === item.id 
                    ? "bg-white/20 text-white shadow-lg" 
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {activePage === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            );
          })}

          {/* Menu Administration (visible seulement pour admin/superAdmin) */}
          <div>
            <button
              onClick={toggleUserMenu}
              className="flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 text-blue-100 hover:bg-white/10 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <Users size={20} />
                <span className="font-medium">Administration</span>
              </div>
              {isUserMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Sous-menus admin */}
            {isUserMenuOpen && (
              <div className="ml-6 mt-1 space-y-1 border-l border-blue-600 pl-3">
                {adminSubMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`flex items-center gap-3 w-full p-2 rounded-lg transition-all duration-300 text-sm
                        ${activePage === item.id 
                          ? "bg-white/20 text-white shadow-lg" 
                          : "text-blue-200 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {activePage === item.id && (
                        <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer sidebar - Fixe en bas */}
        <div className="flex-shrink-0 w-full p-4 border-t border-blue-700">
          <div className="text-center text-blue-300 text-xs">
            <p>© 2026 IMPK</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Overlay quand menu ouvert (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 lg:hidden z-30 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default Sidebar;