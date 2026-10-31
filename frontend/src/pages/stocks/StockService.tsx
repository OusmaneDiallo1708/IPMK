import axios from 'axios';

const isDev = import.meta.env?.DEV || window.location.hostname === 'localhost';

// ✅ En production, l'URL doit contenir le préfixe /api/allRoute
const API_URL = isDev 
    ? 'http://localhost:4999/api/allRoute'
    : 'https://touramancy2026.onrender.com/api/allRoute';

console.log("🌐 Mode:", isDev ? "DÉVELOPPEMENT" : "PRODUCTION");
console.log("🌐 API_URL:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 30000
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(`❌ API Error ${error.response?.status}:`, error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('utilisateur');
            window.location.href = '/profil';
        }
        return Promise.reject(error);
    }
);

// ==================== TYPES ====================
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface Lieu {
    value: string;
    label: string;
}

export interface Stock {
    _id: string;
    date: string;
    lieu: string;
    detail: string;
    entre: number;
    sortie: number;
    total: number;
    prixUnitaire: number;
    produitId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface StockStats {
    totalStock: number;
    totalEntrees: number;
    totalSorties: number;
    totalMouvements: number;
    dernierTotal: number;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export interface StockFilters {
    date_debut?: string;
    date_fin?: string;
    lieu?: string;
    type?: 'entree' | 'sortie';
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateStockData {
    date: string;
    lieu: string;
    detail: string;
    entre: number;
    sortie: number;
    type?: 'entree' | 'sortie';
    montant?: number;
    prixUnitaire?: number;
    produitId?: string | null;
}

// ==================== VALEURS PAR DÉFAUT ====================
const DEFAULT_LIEUX: Lieu[] = [
    { value: 'Bonfi Station', label: '⛽ Bonfi Station' },
    { value: 'Bonfi Eglise', label: '⛪ Bonfi Eglise' },
    { value: 'Tannerie', label: '🏭 Tannerie' },
    { value: 'Partenaire', label: '🤝 Partenaire' },
    { value: 'Client Matelas', label: '🛏️ Client Matelas' },
    { value: 'Client Auto', label: '🚗 Client Auto' },
    { value: 'Client', label: '👤 Client' }
];

// ==================== SERVICES ====================
export const stockService = {
    getStocks: async (params: StockFilters = {}): Promise<ApiResponse<{ stocks: Stock[]; pagination: PaginationInfo; stats: StockStats }>> => {
        try {
            const response = await api.get('/stocks', {
                params: {
                    page: params.page || 1,
                    limit: params.limit || 20,
                    lieu: params.lieu,
                    date_debut: params.date_debut,
                    date_fin: params.date_fin,
                    type: params.type,
                    search: params.search
                }
            });
            return response.data;
        } catch (error: any) {
            console.error("❌ Erreur getStocks:", error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Erreur de chargement",
                data: {
                    stocks: [],
                    pagination: {
                        currentPage: params.page || 1,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: params.limit || 20
                    },
                    stats: {
                        totalStock: 0,
                        totalEntrees: 0,
                        totalSorties: 0,
                        totalMouvements: 0,
                        dernierTotal: 0
                    }
                }
            };
        }
    },

    getLieux: async (): Promise<ApiResponse<{ lieux: Lieu[] }>> => {
        try {
            const response = await api.get('/lieux');
            if (response.data && response.data.lieux) {
                return response.data;
            }
            if (Array.isArray(response.data)) {
                return { success: true, data: { lieux: response.data } };
            }
            return { success: true, data: { lieux: DEFAULT_LIEUX } };
        } catch (error) {
            console.error("❌ Erreur getLieux:", error);
            return { success: true, data: { lieux: DEFAULT_LIEUX } };
        }
    },

    createStock: async (data: CreateStockData): Promise<ApiResponse<{ stock: Stock; nouveauTotal: number }>> => {
        try {
            const isEntree = data.entre > 0;
            const type = isEntree ? 'entree' : 'sortie';
            const montant = isEntree ? data.entre : data.sortie;
            
            const payload = {
                date: data.date,
                lieu: data.lieu,
                detail: data.detail,
                type: type,
                montant: montant,
                quantite: 1,
                prixUnitaire: montant
            };
            
            console.log("📤 Envoi création stock (payload):", JSON.stringify(payload, null, 2));
            const response = await api.post('/stocks', payload);
            console.log("✅ Réponse reçue:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("❌ Erreur createStock:", error);
            console.error("❌ Détail erreur:", error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Erreur de création"
            };
        }
    },

    getStockById: async (id: string): Promise<ApiResponse<{ stock: Stock }>> => {
        try {
            const response = await api.get(`/stocks/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("❌ Erreur getStockById:", error);
            return { success: false, message: error.message };
        }
    },

    updateStock: async (id: string, data: CreateStockData): Promise<ApiResponse<{ stock: Stock }>> => {
        try {
            const isEntree = data.entre > 0;
            const type = isEntree ? 'entree' : 'sortie';
            const montant = isEntree ? data.entre : data.sortie;
            
            const payload = {
                date: data.date,
                lieu: data.lieu,
                detail: data.detail,
                type: type,
                montant: montant,
                quantite: 1,
                prixUnitaire: montant
            };
            const response = await api.put(`/stocks/${id}`, payload);
            return response.data;
        } catch (error: any) {
            console.error("❌ Erreur updateStock:", error);
            return { success: false, message: error.message };
        }
    },

    deleteStock: async (id: string): Promise<ApiResponse> => {
        try {
            const response = await api.delete(`/stocks/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("❌ Erreur deleteStock:", error);
            return { success: false, message: error.message };
        }
    },

    getStockStats: async (): Promise<ApiResponse<StockStats>> => {
        try {
            const response = await api.get('/stats');
            return response.data;
        } catch (error: any) {
            console.error("❌ Erreur getStockStats:", error);
            return {
                success: false,
                message: error.message,
                data: {
                    totalStock: 0,
                    totalEntrees: 0,
                    totalSorties: 0,
                    totalMouvements: 0,
                    dernierTotal: 0
                }
            };
        }
    }
};

export default stockService;