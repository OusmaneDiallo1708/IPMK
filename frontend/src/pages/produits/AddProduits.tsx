// @ts-nocheck
import React, { useState, useEffect } from "react";
import ListeProduits from "./ListeProduits ";
import BtnCategorie from "../categories/BtnCategorie";
import { CheckCircle, XCircle, X, Package, Euro, AlertTriangle, Calendar, Upload } from "lucide-react";
import api from "../../config/axiosConfig";

// Types
interface Categorie {
  _id: string;
  nom: string;
  description: string;
}

interface FormData {
  categorieId: string;
  categorieNom: string;
  nom: string;
  description: string;
  quantite: string;
  prix: string;
  prixAchat: string;
  stock_min: string;
  date_ajout: string;
  date_expiration: string;
  alert_stock: boolean;
  image: File | null;
  activerAlerteStock: boolean;
  autoriserModificationPrixVente: boolean;
}

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// 🔹 Notification Élégante Premium
const Notification: React.FC<{ type: string; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getConfig = () => {
    switch(type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-emerald-500 to-green-600",
          icon: <CheckCircle size={24} className="text-white" />,
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-amber-500 to-orange-600",
          icon: <AlertTriangle size={24} className="text-white" />,
        };
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
          icon: <Package size={24} className="text-white" />,
        };
      default:
        return {
          bg: "bg-gradient-to-r from-red-500 to-rose-600",
          icon: <XCircle size={24} className="text-white" />,
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`${config.bg} text-white rounded-2xl shadow-2xl max-w-md transform transition-all duration-300`}>
        <div className="flex items-start p-4 gap-3">
          <div className="flex-shrink-0 bg-white/20 rounded-xl p-2 backdrop-blur-sm">
            {config.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              {type === "success" ? "Succès" : type === "warning" ? "Attention" : type === "info" ? "Information" : "Erreur"}
            </h4>
            <p className="text-white/90 text-sm mt-1">{message}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="h-1 bg-white/20 rounded-full mx-4 mb-2 overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

const AddProductForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    categorieId: "",
    categorieNom: "",
    nom: "",
    description: "",
    quantite: "",
    prix: "",
    prixAchat: "",
    stock_min: "",
    date_ajout: new Date().toISOString().split('T')[0],
    date_expiration: "",
    alert_stock: false,
    image: null,
    activerAlerteStock: true,
    autoriserModificationPrixVente: false,
  });

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [selectedCategorieNom, setSelectedCategorieNom] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    show: false, 
    type: "", 
    message: "" 
  });

  const showNotification = (type: "success" | "error" | "warning" | "info", message: string): void => {
    setNotification({ show: true, type, message });
  };

  // 🔹 Charger les catégories (corrigé)
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const res = await api.get("/api/allroute/getAllCategorie");
        
        // ✅ Récupération sécurisée du tableau de catégories
        let categoriesData = [];
        if (Array.isArray(res.data.categorie)) {
          categoriesData = res.data.categorie;      // ← La bonne (backend renvoie "categorie")
        } else if (Array.isArray(res.data.categories)) {
          categoriesData = res.data.categories;
        } else if (Array.isArray(res.data.data)) {
          categoriesData = res.data.data;
        } else if (Array.isArray(res.data)) {
          categoriesData = res.data;
        } else if (res.data && typeof res.data === 'object') {
          const found = Object.values(res.data).find(Array.isArray);
          categoriesData = found || [];
        }
        
        console.log("✅ Catégories chargées :", categoriesData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("❌ Erreur chargement catégories :", err);
        showNotification("error", "Impossible de charger les catégories.");
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // 🔹 Quand on sélectionne une catégorie
  const handleCategorieChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const categorieId = e.target.value;
    const categorie = categories.find((cat) => cat._id === categorieId);

    setFormData((prev) => ({
      ...prev,
      categorieId,
      categorieNom: categorie ? categorie.nom : "",
      nom: categorie ? categorie.nom : "",
      description: categorie ? categorie.description : "",
    }));
    
    setSelectedCategorieNom(categorie ? categorie.nom : "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value, type, checked } = e.target;
    if (type === "file") {
      const fileInput = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: fileInput.files?.[0] || null,
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Calcul de la marge bénéficiaire
  const calculateMarge = (): number => {
    const prixAchat = parseFloat(formData.prixAchat);
    const prixVente = parseFloat(formData.prix);
    if (prixAchat && prixVente && prixAchat > 0) {
      return ((prixVente - prixAchat) / prixAchat) * 100;
    }
    return 0;
  };

  // Calcul de la valeur totale du stock
  const calculateValeurStock = (): number => {
    const quantite = parseFloat(formData.quantite);
    const prixVente = parseFloat(formData.prix);
    if (quantite && prixVente) {
      return quantite * prixVente;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
  
    // Validation
    if (!formData.categorieId) {
      showNotification("error", "Veuillez choisir une catégorie.");
      setIsSubmitting(false);
      return;
    }
  
    if (!formData.nom || formData.nom.trim() === "") {
      showNotification("error", "Le nom du produit est requis.");
      setIsSubmitting(false);
      return;
    }
  
    const quantite = parseFloat(formData.quantite);
    const prixVente = parseFloat(formData.prix);
    const prixAchat = parseFloat(formData.prixAchat);
    const stock_min = parseFloat(formData.stock_min);
  
    if (isNaN(quantite) || formData.quantite === "" || quantite <= 0) {
      showNotification("error", "La quantité doit être un nombre positif valide.");
      setIsSubmitting(false);
      return;
    }
  
    if (isNaN(prixAchat) || formData.prixAchat === "" || prixAchat <= 0) {
      showNotification("error", "Le prix d'achat doit être un nombre positif valide.");
      setIsSubmitting(false);
      return;
    }
  
    if (isNaN(prixVente) || formData.prix === "" || prixVente <= 0) {
      showNotification("error", "Le prix de vente doit être un nombre positif valide.");
      setIsSubmitting(false);
      return;
    }
  
    const stockMinValue = isNaN(stock_min) ? 5 : stock_min;
  
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('categorieId', String(formData.categorieId));
      formDataToSend.append('nom', String(formData.nom.trim()));
      
      if (formData.description) {
        formDataToSend.append('description', String(formData.description));
      }
      
      formDataToSend.append('quantite', String(quantite));
      formDataToSend.append('prixVente', String(prixVente));
      formDataToSend.append('prixAchat', String(prixAchat));
      formDataToSend.append('stock_min', String(stockMinValue));
      formDataToSend.append('date_ajout', formData.date_ajout);
      
      if (formData.date_expiration) {
        formDataToSend.append('date_expiration', formData.date_expiration);
      }
  
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      formDataToSend.append('activerAlerteStock', String(formData.activerAlerteStock));
      formDataToSend.append('autoriserModificationPrixVente', String(formData.autoriserModificationPrixVente));
  
      console.log("📤 Envoi des données:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
  
      const response = await api.post("/api/allroute/addProduit", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.status === 200 || response.status === 201) {
        showNotification("success", response.data.message || "Produit ajouté avec succès !");
        
        // Réinitialiser le formulaire
        setFormData({
          categorieId: "",
          categorieNom: "",
          nom: "",
          description: "",
          quantite: "",
          prix: "",
          prixAchat: "",
          stock_min: "",
          date_ajout: new Date().toISOString().split('T')[0],
          date_expiration: "",
          alert_stock: false,
          image: null,
          activerAlerteStock: true,
          autoriserModificationPrixVente: false,
        });
        setSelectedCategorieNom("");
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        window.dispatchEvent(new Event('refreshProduits'));
      }
    } catch (error: any) {
      console.error("❌ Erreur détaillée:", error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Erreur lors de l'ajout du produit";
      showNotification("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl mt-10 border border-blue-100">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: "", message: "" })}
        />
      )}

      <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">
        Ajouter un nouveau Produit
      </h2>
      <p className="text-gray-500 text-center mb-8">Remplissez les informations ci-dessous pour ajouter un produit</p>

      <BtnCategorie />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-2xl shadow-md border border-gray-100 mt-6">
        
        {/* Catégorie */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
          <select
            name="categorieId"
            value={formData.categorieId}
            onChange={handleCategorieChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          >
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                📁 {cat.nom}
              </option>
            ))}
          </select>
          
          {/* Affichage de la catégorie sélectionnée */}
          {selectedCategorieNom && (
            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-blue-700">📁 Catégorie sélectionnée :</span> {selectedCategorieNom}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold text-purple-700">📝 Produit :</span> {formData.nom || selectedCategorieNom}
              </p>
              {formData.description && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-semibold text-purple-700">📄 Description :</span> {formData.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantité *</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="quantite"
              placeholder="Ex: 50"
              value={formData.quantite}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              min="1"
              step="1"
            />
          </div>
        </div>

        {/* Stock minimum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock minimum</label>
          <div className="relative">
            <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="stock_min"
              placeholder="Ex: 5 (défaut: 5)"
              value={formData.stock_min}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              min="0"
              step="1"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">⚠️ Alerte lorsque le stock est en dessous de cette valeur (défaut: 5)</p>
        </div>

        {/* Prix d'achat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prix d'achat (GNF) *</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="prixAchat"
              placeholder="Ex: 125000"
              value={formData.prixAchat}
              onChange={handleChange}
              step="1"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            />
          </div>
        </div>

        {/* Prix de vente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prix de vente (GNF) *</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              name="prix"
              placeholder="Ex: 199990"
              value={formData.prix}
              onChange={handleChange}
              step="1"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            />
          </div>
        </div>

        {/* Date d'ajout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date d'ajout *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              name="date_ajout"
              value={formData.date_ajout}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            />
          </div>
        </div>

        {/* Date d'expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date d'expiration</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              name="date_expiration"
              value={formData.date_expiration}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Laissez vide si non applicable</p>
        </div>

        {/* ✅ NOUVELLES CASES À COCHER */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                name="activerAlerteStock"
                checked={formData.activerAlerteStock}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-700">🔔 Activer l’alerte stock minimum</span>
                <p className="text-xs text-gray-500">Déclenche une notification lorsque le stock descend en dessous du seuil défini.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                name="autoriserModificationPrixVente"
                checked={formData.autoriserModificationPrixVente}
                onChange={handleChange}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <div>
                <span className="font-medium text-gray-700">💰 Autoriser la modification du prix lors des ventes</span>
                <p className="text-xs text-gray-500">Permet au vendeur de modifier le prix unitaire au moment de la vente.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Récapitulatif */}
        {(formData.prixAchat || formData.prix || formData.quantite) && (
          <div className="col-span-1 md:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold text-gray-700 mb-3">📊 Récapitulatif</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Marge bénéficiaire</p>
                <p className={`text-lg font-bold ${calculateMarge() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateMarge().toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valeur stock (vente)</p>
                <p className="text-lg font-bold text-blue-600">
                  {calculateValeurStock().toFixed(0)} GNF
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bénéfice potentiel</p>
                <p className={`text-lg font-bold ${(parseFloat(formData.prix) - parseFloat(formData.prixAchat)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {((parseFloat(formData.prix) - parseFloat(formData.prixAchat)) * parseFloat(formData.quantite)).toFixed(0)} GNF
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image du produit</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-all duration-300 group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-blue-500 group-hover:text-blue-600 transition-colors" />
                <p className="mb-2 text-sm text-blue-600">
                  <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                </p>
                <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                  PNG, JPG, JPEG (MAX. 5MB)
                </p>
              </div>
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                onChange={handleChange} 
                className="hidden" 
              />
            </label>
          </div>
          {formData.image && (
            <p className="text-sm text-green-600 flex items-center mt-2">
              <CheckCircle size={16} className="mr-1" />
              Fichier sélectionné: {formData.image.name}
            </p>
          )}
        </div>

        {/* Bouton de soumission */}
        <div className="col-span-1 md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-25" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ajout en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Package size={20} />
                Publier le Produit
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <ListeProduits />
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-progress-bar { animation: progressBar 3.8s linear forwards; }
      `}</style>
    </div>
  );
};

export default AddProductForm;