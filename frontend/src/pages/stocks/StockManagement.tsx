import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Package, CheckCircle, XCircle } from 'lucide-react';
import StockStats from './StockStats';
import StockFilters from './StockFilters';
import StockModal from './StockModal';
import { stockService, Stock, StockStats as StockStatsType, PaginationInfo, CreateStockData, StockFilters as StockFiltersType } from './StockService';

// Composant Notification
interface NotificationProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }: NotificationProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300">
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
                    type="button"
                >
                    <XCircle size={18} />
                </button>
            </div>
        </div>
    );
};

interface NotificationState {
    show: boolean;
    type: "success" | "error";
    message: string;
}

// ✅ Formatage en Franc Guinéen
const formatGNF = (amount: number): string => {
    if (!amount && amount !== 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
};

const StockManagement: React.FC = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
    });
    const [stats, setStats] = useState<StockStatsType>({
        totalStock: 0,
        totalEntrees: 0,
        totalSorties: 0,
        totalMouvements: 0,
        dernierTotal: 0
    });
    const [filters, setFilters] = useState<StockFiltersType>({});
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [dernierTotal, setDernierTotal] = useState<number>(0);
    const [notification, setNotification] = useState<NotificationState>({ 
        show: false, 
        type: "success", 
        message: "" 
    });

    const showNotification = (type: "success" | "error", message: string): void => {
        setNotification({ show: true, type, message });
    };

    const fetchStocks = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await stockService.getStocks({
                ...filters,
                page: pagination.currentPage
            });
            
            if (response.success && response.data) {
                setStocks(response.data.stocks || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 0,
                    itemsPerPage: 20
                });
                setStats(response.data.stats || {
                    totalStock: 0,
                    totalEntrees: 0,
                    totalSorties: 0,
                    totalMouvements: 0,
                    dernierTotal: 0
                });
                setDernierTotal(response.data.stats?.dernierTotal || 0);
            } else {
                // ✅ Si pas de données, initialiser avec des valeurs par défaut
                setStocks([]);
                setStats({
                    totalStock: 0,
                    totalEntrees: 0,
                    totalSorties: 0,
                    totalMouvements: 0,
                    dernierTotal: 0
                });
                setDernierTotal(0);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des données';
            console.error('Erreur fetchStocks:', error);
            showNotification('error', errorMessage);
            // ✅ Ne pas planter, afficher tableau vide
            setStocks([]);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage]);

    useEffect(() => {
        fetchStocks();
    }, [fetchStocks]);

    const handleFilterChange = (newFilters: StockFiltersType): void => {
        setFilters(newFilters);
        setPagination((prev: PaginationInfo) => ({ ...prev, currentPage: 1 }));
    };

    const handleCreateStock = async (data: CreateStockData): Promise<void> => {
        try {
            const response = await stockService.createStock(data);
            if (response.success) {
                showNotification('success', response.message || 'Mouvement créé avec succès');
                await fetchStocks();
                setIsModalOpen(false);
            } else {
                showNotification('error', response.message || 'Erreur lors de la création');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showNotification('error', err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleUpdateStock = async (id: string, data: CreateStockData): Promise<void> => {
        try {
            const response = await stockService.updateStock(id, data);
            if (response.success) {
                showNotification('success', response.message || 'Mouvement modifié avec succès');
                await fetchStocks();
                setIsModalOpen(false);
                setSelectedStock(null);
            } else {
                showNotification('error', response.message || 'Erreur lors de la modification');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showNotification('error', err.response?.data?.message || 'Erreur lors de la modification');
        }
    };

    const handleDeleteStock = async (id: string): Promise<void> => {
        const confirmDelete: boolean = window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce mouvement ? Cette action est irréversible.');
        if (confirmDelete) {
            try {
                const response = await stockService.deleteStock(id);
                if (response.success) {
                    showNotification('success', response.message || 'Mouvement supprimé avec succès');
                    await fetchStocks();
                } else {
                    showNotification('error', response.message || 'Erreur lors de la suppression');
                }
            } catch (error: unknown) {
                const err = error as { response?: { data?: { message?: string } } };
                showNotification('error', err.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
    };

    const openCreateModal = (): void => {
        setSelectedStock(null);
        setIsModalOpen(true);
    };

    const openEditModal = (stock: Stock): void => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleSave = async (data: CreateStockData): Promise<void> => {
        if (selectedStock) {
            await handleUpdateStock(selectedStock._id, data);
        } else {
            await handleCreateStock(data);
        }
    };

    const formatDate = (date: string): string => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR');
    };

    // ✅ Rafraîchir manuellement
    const handleRefresh = (): void => {
        fetchStocks();
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            {notification.show && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification({ show: false, type: "success", message: "" })}
                />
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📦 Gestion des Fluidité</h1>
                    <p className="text-gray-500 mt-1">Suivi des entrées et sorties(Franc Guinéen - GNF)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 flex items-center space-x-2"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        <span>Actualiser</span>
                    </button>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>Nouveau mouvement</span>
                    </button>
                </div>
            </div>

            <StockStats stats={stats} />
            <StockFilters filters={filters} onFilterChange={handleFilterChange} />

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">N°</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Lieu</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Détail</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Entrée (GNF)</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Sortie (GNF)</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total (GNF)</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                                        <p className="text-gray-500 mt-2">Chargement...</p>
                                    </td>
                                </tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <p>Aucun mouvement de Fluidité trouvé</p>
                                        <button 
                                            type="button"
                                            onClick={openCreateModal} 
                                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            + Ajouter un mouvement
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock: Stock, index: number) => (
                                    <tr key={stock._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">#{index + 1}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatDate(stock.date)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                                                {stock.lieu || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={stock.detail}>
                                            {stock.detail || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {stock.entre && stock.entre > 0 ? (
                                                <span className="text-green-600 font-semibold">
                                                    + {stock.entre.toLocaleString()} GNF
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {stock.sortie && stock.sortie > 0 ? (
                                                <span className="text-red-600 font-semibold">
                                                    - {stock.sortie.toLocaleString()} GNF
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${(stock.total || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatGNF(stock.total || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => openEditModal(stock)} 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                                    title="Modifier"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteStock(stock._id)} 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setPagination((prev: PaginationInfo) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            ◀ Précédent
                        </button>
                        <span className="text-gray-600">Page {pagination.currentPage} sur {pagination.totalPages}</span>
                        <button
                            type="button"
                            onClick={() => setPagination((prev: PaginationInfo) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Suivant ▶
                        </button>
                    </div>
                )}
            </div>

            <StockModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedStock(null);
                }}
                onSave={handleSave}
                stock={selectedStock}
                dernierTotal={dernierTotal}
            />
        </div>
    );
};

export default StockManagement;