// @ts-nocheck
// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Types pour le contexte
interface UserType {
  _id: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  genre?: string;
  role: string;
  photo?: string | null;
  createdAt?: string;
  actif?: boolean; // ✅ AJOUTÉ
}

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: UserType; error?: string; code?: string }>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean; // ✅ AJOUTÉ
  hasRole: (roles: string[]) => boolean; // ✅ AJOUTÉ
  isAdmin: () => boolean; // ✅ AJOUTÉ
  isSuperAdmin: () => boolean; // ✅ AJOUTÉ
  isEmploye: () => boolean; // ✅ AJOUTÉ
  isVisiteur: () => boolean; // ✅ AJOUTÉ
  isActif: () => boolean; // ✅ AJOUTÉ
  canAccess: (permissions: string[]) => boolean; // ✅ AJOUTÉ (pour employés)
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configuration de base de l'API
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999/api';

  // ✅ Fonction pour configurer l'intercepteur axios avec le token
  const setupAxiosInterceptors = (token: string) => {
    axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  };

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Configurer l'intercepteur avec le token
      setupAxiosInterceptors(token);

      try {
        // 🔥 VRAIE requête vers ton backend
        const response = await axios.get(`${API_URL}/utilisateur/profil`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUser(response.data);
      } catch (error: any) {
        console.error('Erreur de vérification auth:', error.response?.status, error.message);
        
        // Si 401 (token invalide/expiré) ou 403 (compte inactif)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('utilisateur');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [API_URL]);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: UserType; error?: string; code?: string }> => {
    try {
      const response = await axios.post(`${API_URL}/utilisateur/connexion`, {
        email,
        motDePasse: password // ✅ Utiliser "motDePasse" comme dans ton backend
      });
      
      const { utilisateur, token, success, message } = response.data;
      
      if (success && token && utilisateur) {
        // ✅ Vérifier si le compte est actif (backend le fait déjà, mais double vérification)
        if (!utilisateur.actif) {
          return { 
            success: false, 
            error: 'Votre compte est en attente d\'activation par l\'administrateur',
            code: 'ACCOUNT_INACTIVE'
          };
        }
        
        localStorage.setItem('token', token);
        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
        setupAxiosInterceptors(token);
        setUser(utilisateur);
        
        return { success: true, user: utilisateur };
      }
      
      return { 
        success: false, 
        error: message || 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      };
    } catch (error: any) {
      console.error('Erreur login:', error.response?.data || error.message);
      
      // ✅ Gérer les erreurs spécifiques du backend
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      const errorCode = error.response?.data?.code;
      
      return { 
        success: false, 
        error: errorMessage,
        code: errorCode
      };
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    setUser(null);
    
    // ✅ Appeler l'API de déconnexion si besoin
    try {
      axios.get(`${API_URL}/utilisateur/logout`);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // ✅ Vérifier si l'utilisateur a un certain rôle
  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = (): boolean => {
    return hasRole(['admin', 'superAdmin']);
  };

  // ✅ Vérifier si l'utilisateur est super admin
  const isSuperAdmin = (): boolean => {
    return user?.role === 'superAdmin';
  };

  // ✅ Vérifier si l'utilisateur est employé
  const isEmploye = (): boolean => {
    return user?.role === 'employé';
  };

  // ✅ Vérifier si l'utilisateur est visiteur
  const isVisiteur = (): boolean => {
    return user?.role === 'visiteur';
  };

  // ✅ Vérifier si le compte est actif
  const isActif = (): boolean => {
    return user?.actif === true;
  };

  // ✅ Vérifier si l'utilisateur a accès à certaines fonctionnalités (pour les employés)
  const canAccess = (permissions: string[]): boolean => {
    if (!user) return false;
    
    // SuperAdmin et Admin ont tous les accès
    if (isAdmin() || isSuperAdmin()) return true;
    
    // Employé - accès limité
    if (isEmploye()) {
      const allowedPermissions = ['products', 'sales', 'view_stock'];
      return permissions.every(p => allowedPermissions.includes(p));
    }
    
    // Visiteur - accès très limité
    if (isVisiteur()) {
      return false;
    }
    
    return false;
  };

  // ✅ Déterminer si l'utilisateur est authentifié (connecté ET compte actif)
  const isAuthenticated = !!(user && user.actif === true);

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isEmploye,
    isVisiteur,
    isActif,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};