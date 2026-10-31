import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, X, User, ShoppingCart, RefreshCw, DollarSign, Package, AlertTriangle, Calendar, TrendingUp, CreditCard, Receipt, BarChart3 } from "lucide-react";
import ListeVents from "./ListeVents";
import api from "../../config/axiosConfig";

// Types
interface Produit {
  _id: string;
  categorieNom: string;
  description?: string;
  prixVente: number;
  stock: number;
  autoriserModificationPrixVente: boolean; // ✅ NOUVEAU
}

interface UserType {
  _id: string;
  nomComplet?: string;
  email?: string;
  role?: string;
}

interface FormData {
  produitId: string;
  quantite: string;
  prix_unitaire: string;
  date_vente: string;
  utilisateurId: string;
}

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// Formatage en Franc Guinéen
const formatGNF = (amount: number): string => {
  if (!amount && amount !== 0) return '0 GNF';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';
};

// Notification Élégante
const Notification: React.FC<{ type: string; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getConfig = () => {
    switch(type) {
      case "success":
        return { bg: "bg-gradient-to-r from-emerald-500 to-green-600", icon: <CheckCircle size={24} className="text-white" /> };
      case "warning":
        return { bg: "bg-gradient-to-r from-amber-500 to-orange-600", icon: <AlertTriangle size={24} className="text-white" /> };
      default:
        return { bg: "bg-gradient-to-r from-red-500 to-rose-600", icon: <XCircle size={24} className="text-white" /> };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`${config.bg} text-white rounded-2xl shadow-2xl max-w-md`}>
        <div className="flex items-start p-4 gap-3">
          <div className="flex-shrink-0 bg-white/20 rounded-xl p-2">{config.icon}</div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-sm uppercase">
              {type === "success" ? "Vente réussie" : type === "warning" ? "Attention" : "Erreur"}
            </h4>
            <p className="text-white/90 text-sm mt-1">{message}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="h-1 bg-white/20 rounded-full mx-4 mb-2 overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

const AddVenteForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    produitId: "",
    quantite: "",
    prix_unitaire: "",
    date_vente: new Date().toISOString().split('T')[0],
    utilisateurId: "",
  });

  const [produits, setProduits] = useState<Produit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingProduits, setIsLoadingProduits] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "", message: "" });
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);

  const showNotification = (type: "success" | "error" | "warning" | "info", message: string): void => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 4000);
  };

  const montantTotal = formData.quantite && formData.prix_unitaire 
    ? (parseFloat(formData.quantite) * parseFloat(formData.prix_unitaire))
    : 0;

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setIsLoadingProduits(true);
        const produitsRes = await api.get<{ produit: Produit[] }>('/api/allroute/getAllProduit');
        setProduits(produitsRes.data.produit || []);

        const storedUser = localStorage.getItem("utilisateur");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user && user._id) {
            setCurrentUser(user);
            setFormData(prev => ({ ...prev, utilisateurId: user._id }));
          }
        }
      } catch (err) {
        showNotification("error", "Impossible de charger les produits.");
      } finally {
        setIsLoadingProduits(false);
      }
    };
    fetchData();
  }, []);

  const handleProduitChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const produitId = e.target.value;
    const produit = produits.find((p) => p._id === produitId);
    setSelectedProduit(produit || null);
    setFormData(prev => ({
      ...prev,
      produitId,
      quantite: "",
      prix_unitaire: produit ? String(produit.prixVente) : "",
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isQuantiteValide = (): boolean => {
    const quantite = parseInt(formData.quantite);
    if (isNaN(quantite) || quantite <= 0) return false;
    if (selectedProduit && quantite > selectedProduit.stock) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.produitId || !formData.utilisateurId) {
      showNotification("error", "Veuillez choisir un produit et vous connecter.");
      setIsSubmitting(false);
      return;
    }

    const quantite = parseInt(formData.quantite);
    if (isNaN(quantite) || quantite <= 0) {
      showNotification("error", "La quantité doit être un nombre supérieur à zéro.");
      setIsSubmitting(false);
      return;
    }

    if (selectedProduit && quantite > selectedProduit.stock) {
      showNotification("error", `Stock insuffisant! Disponible: ${selectedProduit.stock}`);
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ Le prix envoyé est celui saisi (modifié ou non)
      const response = await api.post('/api/allroute/addVente', {
        produitId: formData.produitId,
        utilisateurId: formData.utilisateurId,
        quantite: quantite,
        prix_unitaire: parseFloat(formData.prix_unitaire),
        date_vente: formData.date_vente,
      });

      if (response.status === 201 || response.status === 200) {
        showNotification("success", `Vente enregistrée ! ${formatGNF(montantTotal)}`);
        
        setFormData({
          produitId: "",
          quantite: "",
          prix_unitaire: "",
          date_vente: new Date().toISOString().split('T')[0],
          utilisateurId: formData.utilisateurId,
        });
        setSelectedProduit(null);

        const produitsRes = await api.get<{ produit: Produit[] }>('/api/allroute/getAllProduit');
        setProduits(produitsRes.data.produit || []);
        window.dispatchEvent(new CustomEvent('refreshVentes'));
      }
    } catch (error: any) {
      showNotification("error", error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduits) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ show: false, type: "", message: "" })} />}
      
      <div className="justify-center">
        <div>
          <h1 className="text-2xl sm:text-3xl  font-bold text-gray-800">💰 Enregistrement de Vente</h1>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {currentUser && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <User className="text-green-600" size={20} />
                <div><p className="font-semibold">Vendeur: {currentUser.nomComplet || "Utilisateur"}</p></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produit *</label>
              <select name="produitId" value={formData.produitId} onChange={handleProduitChange} className="w-full p-3 border rounded-xl" required>
                <option value="">-- Sélectionner --</option>
                {produits.map(prod => (
                  <option key={prod._id} value={prod._id} disabled={prod.stock <= 0}>
                    {prod.categorieNom} - Stock: {prod.stock} - {formatGNF(prod.prixVente)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input type="date" name="date_vente" value={formData.date_vente} onChange={handleChange} className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité *</label>
              <input type="number" name="quantite" value={formData.quantite} onChange={handleChange} min="1" max={selectedProduit?.stock} className="w-full p-3 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix unitaire (GNF)
                {selectedProduit && !selectedProduit.autoriserModificationPrixVente && (
                  <span className="text-xs text-gray-400 ml-2">(fixe)</span>
                )}
                {selectedProduit && selectedProduit.autoriserModificationPrixVente && (
                  <span className="text-xs text-green-500 ml-2">(modifiable)</span>
                )}
              </label>
              <input
                type="number"
                name="prix_unitaire"
                value={formData.prix_unitaire}
                onChange={handleChange}
                disabled={!selectedProduit?.autoriserModificationPrixVente}
                className={`w-full p-3 border rounded-xl ${
                  selectedProduit && !selectedProduit.autoriserModificationPrixVente
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'bg-white'
                }`}
                step="1"
                min="0"
                required
              />
              {selectedProduit && !selectedProduit.autoriserModificationPrixVente && (
                <p className="text-xs text-gray-400 mt-1">
                  Le prix est fixé à {formatGNF(selectedProduit.prixVente)} (modification non autorisée)
                </p>
              )}
            </div>
          </div>

          {selectedProduit && isQuantiteValide() && montantTotal > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
              <div className="flex justify-between items-center">
                <div><p className="font-semibold">💰 Montant Total</p></div>
                <div><p className="text-2xl font-bold text-green-600">{formatGNF(montantTotal)}</p></div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting || !formData.produitId || !isQuantiteValide()} className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50">
            {isSubmitting ? <RefreshCw className="animate-spin inline mr-2" size={20} /> : <ShoppingCart className="inline mr-2" size={20} />}
            {isSubmitting ? "Traitement..." : "Finaliser la vente"}
          </button>
        </form>
      </div>

      {/* Liste des ventes */}
      <ListeVents />

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes progressBar { from { width: 100%; } to { width: 0%; } }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-progress-bar { animation: progressBar 3.8s linear forwards; }
      `}</style>
    </div>
  );
};

export default AddVenteForm;