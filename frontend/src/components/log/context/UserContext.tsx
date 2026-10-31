// @ts-nocheck
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// =======================
// 📌 Configuration API URL (EN DUR POUR VERCELL)
// =======================
const API_URL = "https://touramancy2026.onrender.com";

interface User {
  _id?: string;
  nomComplet: string;
  email: string;
  photo?: string;
  role?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchUser = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("⚠️ Aucun token trouvé");
        setUser(null);
        setIsLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/api/utilisateur/profil`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true,
      });
      
      if (res.data) {
        const userData: User = {
          _id: res.data._id,
          nomComplet: res.data.nomComplet || res.data.nom || '',
          email: res.data.email || '',
          photo: res.data.photo,
          role: res.data.role
        };
        setUser(userData);
        localStorage.setItem("utilisateur", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("utilisateur");
      }
    } catch (err: any) {
      console.error("❌ Erreur fetchUser:", err.response?.status, err.message);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem("utilisateur");
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.get(`${API_URL}/api/utilisateur/logout`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem("utilisateur");
      setUser(null);
      navigate("/signin", { replace: true });
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("utilisateur");
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        fetchUser();
      } catch (e) {
        console.error("Erreur parsing storedUser:", e);
        setUser(null);
        setIsLoading(false);
      }
    } else if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, logout, fetchUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};