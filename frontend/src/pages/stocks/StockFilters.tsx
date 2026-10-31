import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { stockService, Lieu, StockFilters as StockFiltersType } from './StockService';

interface StockFiltersProps {
    filters: StockFiltersType;
    onFilterChange: (filters: StockFiltersType) => void;
}

// ✅ Type pour les lieux par défaut
interface DefaultLieu {
    value: string;
    label: string;
}

// ✅ Type pour la réponse de l'API
interface LieuxResponse {
    success: boolean;
    data?: {
        lieux?: Lieu[] | DefaultLieu[];
        data?: Lieu[] | DefaultLieu[];
    } | Lieu[] | DefaultLieu[];
}

const StockFilters: React.FC<StockFiltersProps> = ({ filters, onFilterChange }) => {
    const [lieux, setLieux] = useState<Lieu[] | DefaultLieu[]>([]);
    const [loadingLieux, setLoadingLieux] = useState<boolean>(false);

    // ✅ Valeurs par défaut des lieux
    const defaultLieux: DefaultLieu[] = [
        { value: 'Magasin principal', label: '🏪 Magasin principal' },
        { value: 'Entrepôt secondaire', label: '🏭 Entrepôt secondaire' },
        { value: 'Boutique', label: '🛍️ Boutique' },
        { value: 'Dépôt central', label: '📦 Dépôt central' },
        { value: 'Showroom', label: '✨ Showroom' },
        { value: 'Atelier', label: '🔧 Atelier' }
    ];

    useEffect(() => {
        const fetchLieux = async (): Promise<void> => {
            setLoadingLieux(true);
            try {
                const response = await stockService.getLieux() as LieuxResponse;
                console.log("📦 Lieux reçus:", response);
                
                // ✅ Vérifier la structure de la réponse
                if (response?.success && response?.data) {
                    // Cas 1: response.data.lieux
                    if ('lieux' in response.data && Array.isArray(response.data.lieux)) {
                        setLieux(response.data.lieux);
                    }
                    // Cas 2: response.data.data
                    else if ('data' in response.data && Array.isArray(response.data.data)) {
                        setLieux(response.data.data);
                    }
                    // Cas 3: response.data est directement un tableau
                    else if (Array.isArray(response.data)) {
                        setLieux(response.data);
                    }
                    else {
                        setLieux(defaultLieux);
                    }
                } else {
                    setLieux(defaultLieux);
                }
            } catch (error) {
                console.error('❌ Erreur chargement lieux:', error);
                setLieux(defaultLieux);
            } finally {
                setLoadingLieux(false);
            }
        };
        fetchLieux();
    }, []);

    const handleChange = (name: keyof StockFiltersType, value: string): void => {
        onFilterChange({ ...filters, [name]: value });
    };

    const resetDates = (): void => {
        onFilterChange({ ...filters, date_debut: '', date_fin: '' });
    };

    const resetAllFilters = (): void => {
        onFilterChange({ date_debut: '', date_fin: '', lieu: '', type: '', search: '' });
    };

    const hasActiveFilters = (): boolean => {
        return !!(filters.date_debut || filters.date_fin || filters.lieu || filters.type || filters.search);
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date de début */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" />
                        Date de début
                    </label>
                    <input
                        type="date"
                        value={filters.date_debut || ''}
                        onChange={(e) => handleChange('date_debut', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Date de fin */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" />
                        Date de fin
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={filters.date_fin || ''}
                            onChange={(e) => handleChange('date_fin', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                        {(filters.date_debut || filters.date_fin) && (
                            <button
                                type="button"
                                onClick={resetDates}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                aria-label="Réinitialiser les dates"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Lieu */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin size={16} className="text-blue-500" />
                        Lieu
                    </label>
                    <select
                        value={filters.lieu || ''}
                        onChange={(e) => handleChange('lieu', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loadingLieux}
                    >
                        <option value="">📍 Tous les lieux</option>
                        {lieux && lieux.length > 0 ? (
                            lieux.map((lieu: Lieu | DefaultLieu, index: number) => (
                                <option key={lieu.value || index} value={lieu.value}>
                                    {lieu.label}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Chargement des lieux...</option>
                        )}
                    </select>
                    {loadingLieux && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            Chargement des lieux...
                        </p>
                    )}
                </div>
            </div>
            
            {/* Résumé des filtres actifs */}
            {hasActiveFilters() && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">🔍 Filtres actifs :</span>
                        
                        {filters.date_debut && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                📅 Début: {new Date(filters.date_debut).toLocaleDateString('fr-FR')}
                                <button 
                                    onClick={() => handleChange('date_debut', '')} 
                                    className="hover:text-blue-900 ml-1"
                                    aria-label="Supprimer le filtre date début"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        
                        {filters.date_fin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                📅 Fin: {new Date(filters.date_fin).toLocaleDateString('fr-FR')}
                                <button 
                                    onClick={() => handleChange('date_fin', '')} 
                                    className="hover:text-blue-900 ml-1"
                                    aria-label="Supprimer le filtre date fin"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        
                        {filters.lieu && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                📍 Lieu: {filters.lieu}
                                <button 
                                    onClick={() => handleChange('lieu', '')} 
                                    className="hover:text-green-900 ml-1"
                                    aria-label="Supprimer le filtre lieu"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        
                        {filters.type && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {filters.type === 'entree' ? '📥 Entrée' : '📤 Sortie'}
                                <button 
                                    onClick={() => handleChange('type', '')} 
                                    className="hover:text-purple-900 ml-1"
                                    aria-label="Supprimer le filtre type"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        
                        {filters.search && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                🔎 Recherche: {filters.search}
                                <button 
                                    onClick={() => handleChange('search', '')} 
                                    className="hover:text-orange-900 ml-1"
                                    aria-label="Supprimer la recherche"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        
                        <button
                            onClick={resetAllFilters}
                            className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Tout effacer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockFilters;