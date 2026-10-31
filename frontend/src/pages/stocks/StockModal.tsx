import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { stockService, Lieu, CreateStockData, Stock } from './StockService';

interface ElegantNotificationProps {
    type: "success" | "error";
    message: string;
    onClose: () => void;
    title: string;
}

const ElegantNotification: React.FC<ElegantNotificationProps> = ({ type, message, onClose, title }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
            <div className={`bg-gradient-to-r ${type === "success" ? "from-emerald-500 to-green-600" : "from-red-500 to-rose-600"} text-white rounded-2xl shadow-2xl max-w-md`}>
                <div className="flex items-start p-4 gap-3">
                    <div className="flex-shrink-0 bg-white/20 rounded-xl p-2">
                        {type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white text-sm uppercase">{title}</h4>
                        <p className="text-white/90 text-sm mt-1">{message}</p>
                    </div>
                    <button onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateStockData) => Promise<void>;
    stock: Stock | null;
    dernierTotal: number;
}

interface FormData {
    date: string;
    lieu: string;
    detail: string;
    entre: number;
    sortie: number;
}

interface Errors {
    lieu?: string;
    detail?: string;
    general?: string;
}

interface NotificationState {
    show: boolean;
    type: "success" | "error";
    message: string;
    title: string;
}

// ✅ Valeurs par défaut des lieux
const DEFAULT_LIEUX: Lieu[] = [
    { value: 'Magasin principal', label: '🏪 Magasin principal' },
    { value: 'Entrepôt secondaire', label: '🏭 Entrepôt secondaire' },
    { value: 'Boutique', label: '🛍️ Boutique' },
    { value: 'Dépôt central', label: '📦 Dépôt central' },
    { value: 'Showroom', label: '✨ Showroom' },
    { value: 'Atelier', label: '🔧 Atelier' }
];

const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, onSave, stock, dernierTotal }) => {
    const [formData, setFormData] = useState<FormData>({
        date: new Date().toISOString().split('T')[0],
        lieu: '',
        detail: '',
        entre: 0,
        sortie: 0
    });
    const [lieux, setLieux] = useState<Lieu[]>(DEFAULT_LIEUX);
    const [loadingLieux, setLoadingLieux] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [notification, setNotification] = useState<NotificationState>({ 
        show: false, 
        type: "success", 
        message: "", 
        title: "" 
    });

    useEffect(() => {
        const fetchLieux = async (): Promise<void> => {
            setLoadingLieux(true);
            try {
                const response = await stockService.getLieux();
                console.log("📦 Lieux reçus dans modal:", response);
                
                if (response && response.success && response.data) {
                    if (response.data.lieux && Array.isArray(response.data.lieux)) {
                        setLieux(response.data.lieux);
                    } else if (Array.isArray(response.data)) {
                        setLieux(response.data);
                    } else {
                        setLieux(DEFAULT_LIEUX);
                    }
                } else {
                    setLieux(DEFAULT_LIEUX);
                }
            } catch (error) {
                console.error('❌ Erreur chargement lieux:', error);
                setLieux(DEFAULT_LIEUX);
            } finally {
                setLoadingLieux(false);
            }
        };
        fetchLieux();
    }, []);

    useEffect(() => {
        if (stock) {
            setFormData({
                date: stock.date?.split('T')[0] || new Date().toISOString().split('T')[0],
                lieu: stock.lieu || '',
                detail: stock.detail || '',
                entre: stock.entre || 0,
                sortie: stock.sortie || 0
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                lieu: '',
                detail: '',
                entre: 0,
                sortie: 0
            });
        }
        setErrors({});
    }, [stock, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        
        if (name === 'entre') {
            const entreValue = parseInt(value) || 0;
            setFormData(prev => ({ 
                ...prev, 
                entre: entreValue,
                sortie: 0  // ✅ Forcer sortie à 0 quand on met une entrée
            }));
        } else if (name === 'sortie') {
            const sortieValue = parseInt(value) || 0;
            setFormData(prev => ({ 
                ...prev, 
                sortie: sortieValue,
                entre: 0  // ✅ Forcer entrée à 0 quand on met une sortie
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Errors = {};
        
        if (!formData.lieu) newErrors.lieu = 'Le lieu est requis';
        if (!formData.detail) newErrors.detail = 'Le détail est requis';
        
        // ✅ Vérifier qu'il y a une entrée OU une sortie (exclusif)
        const hasEntre = formData.entre > 0;
        const hasSortie = formData.sortie > 0;
        
        // if (!hasEntre && !hasSortie) {
        //     newErrors.general = 'Veuillez renseigner une entrée OU une sortie';
        // }
        
        if (hasEntre && hasSortie) {
            newErrors.general = 'Veuillez renseigner soit une entrée, soit une sortie, pas les deux';
        }
        
        if (formData.sortie > 0 && formData.sortie > dernierTotal) {
            newErrors.general = `Fluidité insuffisant ! Fluidité actuel: ${dernierTotal.toLocaleString()} GNF`;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!validateForm()) return;
        
        // ✅ Déterminer le type et le montant pour le backend
        const isEntree = formData.entre > 0;
        const type = isEntree ? 'entree' : 'sortie';
        const montant = isEntree ? formData.entre : formData.sortie;
        
        // ✅ Construire les données POUR LE BACKEND (uniquement ce qu'il attend)
        const submitData: CreateStockData = {
            date: formData.date,
            lieu: formData.lieu,
            detail: formData.detail,
            entre: formData.entre,
            sortie: formData.sortie,
            type: type,
            montant: montant
        };
        
        console.log("📤 Envoi des données au backend:", {
            date: submitData.date,
            lieu: submitData.lieu,
            detail: submitData.detail,
            type: submitData.type,
            montant: submitData.montant
        });
        
        try {
            await onSave(submitData);
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setNotification({ 
                show: true, 
                type: "error", 
                title: "Erreur", 
                message: err.response?.data?.message || "Erreur lors de l'enregistrement" 
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {notification.show && (
                <ElegantNotification 
                    type={notification.type} 
                    title={notification.title}
                    message={notification.message} 
                    onClose={() => setNotification({ show: false, type: "success", message: "", title: "" })} 
                />
            )}

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Package className="text-blue-600" size={24} />
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {stock ? 'Modifier mouvement' : 'Nouveau mouvement'}
                                </h2>
                            </div>
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                            <p className="text-sm text-gray-600">💰 Fluidité actuel en caisse</p>
                            <p className={`text-2xl font-bold ${dernierTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {dernierTotal.toLocaleString()} GNF
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {dernierTotal > 0 ? '✓ Solde positif' : dernierTotal < 0 ? '⚠️ Solde négatif' : '⚖️ Solde nul'}
                            </p>
                        </div>
                        
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertCircle size={18} />
                                {errors.general}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">📍 Lieu *</label>
                                <select
                                    name="lieu"
                                    value={formData.lieu}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    disabled={loadingLieux}
                                >
                                    <option value="">Sélectionner un lieu</option>
                                    {lieux && lieux.length > 0 ? (
                                        lieux.map((lieu: Lieu) => (
                                            <option key={lieu.value} value={lieu.value}>
                                                {lieu.label}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Chargement...</option>
                                    )}
                                </select>
                                {errors.lieu && <p className="text-red-500 text-sm mt-1">{errors.lieu}</p>}
                                {loadingLieux && <p className="text-gray-400 text-xs mt-1">Chargement des lieux...</p>}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">📝 Détail *</label>
                            <textarea
                                name="detail"
                                value={formData.detail}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Description détaillée..."
                            />
                            {errors.detail && <p className="text-red-500 text-sm mt-1">{errors.detail}</p>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Entrée */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <label className="block text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    Entrée (GNF)
                                </label>
                                <input
                                    type="number"
                                    name="entre"
                                    value={formData.entre || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="1000"
                                    placeholder="Ex: 1000000"
                                    className="w-full px-4 py-3 bg-white border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-green-700 font-semibold"
                                />
                                <p className="text-xs text-green-600 mt-1">✓ Ajoute de l'argent à la caisse</p>
                            </div>
                            
                            {/* Sortie */}
                            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                <label className="block text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                                    <TrendingDown size={16} />
                                    Sortie (GNF)
                                </label>
                                <input
                                    type="number"
                                    name="sortie"
                                    value={formData.sortie || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="1000"
                                    placeholder="Ex: 500000"
                                    className="w-full px-4 py-3 bg-white border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-red-700 font-semibold"
                                />
                                <p className="text-xs text-red-600 mt-1">⚠️ Retire de l'argent de la caisse</p>
                            </div>
                        </div>
                        
                        {/* Récapitulatif */}
                        {(formData.entre > 0 || formData.sortie > 0) && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                <p className="text-sm text-gray-600 font-medium mb-2">📊 Récapitulatif</p>
                                <div className="space-y-1 text-sm">
                                    <p className="flex justify-between">
                                        <span>Fluidité avant :</span>
                                        <span className="font-semibold">{dernierTotal.toLocaleString()} GNF</span>
                                    </p>
                                    <p className="flex justify-between text-green-600">
                                        <span>+ Entrée :</span>
                                        <span className="font-semibold">{formData.entre.toLocaleString()} GNF</span>
                                    </p>
                                    <p className="flex justify-between text-red-600">
                                        <span>- Sortie :</span>
                                        <span className="font-semibold">{formData.sortie.toLocaleString()} GNF</span>
                                    </p>
                                    <div className="border-t border-blue-200 pt-2 mt-2">
                                        <p className="flex justify-between font-bold">
                                            <span>Fluidité après :</span>
                                            <span className={`${(dernierTotal + formData.entre - formData.sortie) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {(dernierTotal + formData.entre - formData.sortie).toLocaleString()} GNF
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-3 pt-4">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-slide-in-right { animation: slide-in-right 0.4s ease-out; }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-scale-in { animation: scale-in 0.3s ease-out; }
            `}</style>
        </>
    );
};

export default StockModal;