// src/config/axiosConfig.ts
import axios from 'axios';

// const API_BASE_URL = 'https://touramancy2026.onrender.com'; // 👈 Utilise la même URL que UserContext
// 👇 Utilise une variable d'environnement ou une URL par défaut
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

// Créer une instance Axios
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token à CHAQUE requête (comme dans UserContext)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`✅ [${config.method?.toUpperCase()}] ${config.url}`);
        } else {
            console.log(`⚠️ [${config.method?.toUpperCase()}] ${config.url} - Pas de token`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 et 403
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status, data } = error.response || {};
        
        // 🔐 401: Token invalide ou expiré
        if (status === 401) {
            console.error('❌ Session expirée - Token invalide');
            localStorage.removeItem('token');
            localStorage.removeItem('utilisateur');
            
            // Éviter les redirections infinies
            const publicPaths = ['/connexion', '/signin', '/inscription', '/register', '/profil'];
            const isPublicPath = publicPaths.some(path => window.location.pathname.includes(path));
            
            if (!isPublicPath) {
                window.location.href = '/connexion';
            }
        }
        
        // 🚫 403: Compte inactif ou accès non autorisé
        if (status === 403) {
            console.error('❌ Accès refusé:', data?.message);
            
            // Si le compte est inactif, rediriger vers une page d'information
            if (data?.code === 'ACCOUNT_INACTIVE') {
                localStorage.removeItem('token');
                localStorage.removeItem('utilisateur');
                
                // Stocker un message pour l'afficher sur la page de connexion
                sessionStorage.setItem('login_error', 'Votre compte est en attente d\'activation par l\'administrateur');
                window.location.href = '/connexion';
            }
            
            // Gérer les erreurs de permission (rôle insuffisant)
            if (data?.code === 'FORBIDDEN' || data?.code === 'INSUFFICIENT_PERMISSIONS') {
                console.warn('Permission refusée:', data.message);
                
                // Optionnel: émettre un événement pour afficher une notification
                const event = new CustomEvent('unauthorized-access', { 
                    detail: { message: data.message, code: data.code }
                });
                window.dispatchEvent(event);
            }
        }
        
        // ⏱️ 429: Trop de requêtes
        if (status === 429) {
            console.warn('⏱️ Trop de requêtes, veuillez patienter');
            const event = new CustomEvent('rate-limit', { 
                detail: { message: data?.message || 'Trop de requêtes, veuillez patienter' }
            });
            window.dispatchEvent(event);
        }
        
        // 🌐 500: Erreur serveur
        if (status === 500) {
            console.error('❌ Erreur serveur:', data?.message);
            const event = new CustomEvent('server-error', { 
                detail: { message: 'Erreur serveur, veuillez réessayer plus tard' }
            });
            window.dispatchEvent(event);
        }
        
        return Promise.reject(error);
    }
);

// ✅ Fonction utilitaire pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
};

// ✅ Fonction pour obtenir le token
export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// ✅ Fonction pour obtenir l'utilisateur stocké
export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('utilisateur');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

// ✅ Fonction pour vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (roles: string[]): boolean => {
    const user = getStoredUser();
    if (!user) return false;
    return roles.includes(user.role);
};

// ✅ Fonction pour vérifier si l'utilisateur est admin
export const isAdmin = (): boolean => {
    return hasRole(['admin', 'superAdmin']);
};

// ✅ Fonction pour vérifier si l'utilisateur est super admin
export const isSuperAdmin = (): boolean => {
    const user = getStoredUser();
    return user?.role === 'superAdmin';
};

// ✅ Fonction pour vérifier si l'utilisateur est employé
export const isEmploye = (): boolean => {
    const user = getStoredUser();
    return user?.role === 'employé';
};

// ✅ Fonction pour vérifier si le compte est actif
export const isAccountActive = (): boolean => {
    const user = getStoredUser();
    return user?.actif === true;
};

// ✅ Fonction pour la déconnexion propre
export const logout = async (): Promise<void> => {
    try {
        await api.get('/api/utilisateur/logout');
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');
        window.location.href = '/connexion';
    }
};

export default api;