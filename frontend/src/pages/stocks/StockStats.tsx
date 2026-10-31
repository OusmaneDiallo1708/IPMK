import React from 'react';
import { Package, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StockStatsProps {
    stats: {
        totalStock: number;
        totalEntrees: number;
        totalSorties: number;
        totalMouvements: number;
        dernierTotal?: number;
    };
}

const formatGNF = (amount: number): string => {
    if (!amount && amount !== 0) return '0 GNF';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
};

const StockStats: React.FC<StockStatsProps> = ({ stats }) => {
    // ✅ CORRECTION: Utiliser dernierTotal au lieu de totalStock
    const stockActuel = stats.dernierTotal || 0;  // ← Changement ici !
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Carte Stock Total */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium">Fluidité Total</p>
                        <p className="text-3xl font-bold mt-2">{formatGNF(stockActuel)}</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3">
                        <Package size={28} />
                    </div>
                </div>
            </div>

            {/* Carte Entrées du mois */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-green-100 text-sm font-medium">Entrées (mois)</p>
                        <p className="text-3xl font-bold mt-2">{formatGNF(stats.totalEntrees || 0)}</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3">
                        <TrendingUp size={28} />
                    </div>
                </div>
            </div>

            {/* Carte Sorties du mois */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-red-100 text-sm font-medium">Sorties (mois)</p>
                        <p className="text-3xl font-bold mt-2">{formatGNF(stats.totalSorties || 0)}</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3">
                        <TrendingDown size={28} />
                    </div>
                </div>
            </div>

            {/* Carte Nombre de mouvements */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-purple-100 text-sm font-medium">Mouvements</p>
                        <p className="text-3xl font-bold mt-2">{stats.totalMouvements || 0}</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3">
                        <Activity size={28} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockStats;