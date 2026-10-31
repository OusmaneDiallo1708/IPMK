// @ts-nocheck
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import api from "../../config/axiosConfig"; // 👈 IMPORT DE L'INSTANCE AXIOS

interface FormData {
  nom: string;
  description: string;
}

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "";
  message: string;
}

interface ApiResponse {
  message?: string;
  categorie?: {
    _id: string;
    nom: string;
    description: string;
  };
}

// 🔹 Notification élégante
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 animate-in slide-in-from-right-10`}>
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
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const AddCategorieForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    description: "",
  });

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showNotification = (type: "success" | "error", message: string): void => {
    setNotification({
      show: true,
      type,
      message
    });
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  // Gestion des changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ✅ UTILISATION DE L'INSTANCE api
      const res = await api.post<ApiResponse>("/api/allroute/addCategorie", formData);
      
      showNotification("success", res.data.message || "Catégorie ajoutée avec succès !");
      setFormData({ nom: "", description: "" }); // reset du formulaire
      
    } catch (error: any) {
      console.error("Erreur:", error);
      const errorMessage = error.response?.data?.message || "Erreur lors de l'ajout de la catégorie";
      showNotification("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
      {/* Notification élégante */}
      {notification.show && (
        <Notification
          type={notification.type as "success" | "error"}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: "", message: "" })}
        />
      )}

      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold ml-3 text-gray-800">Ajouter une Catégorie</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champ Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de la catégorie <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Ex: Électronique, Mode, Maison..."
          />
        </div>

        {/* Champ Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
            placeholder="Décrivez brièvement cette catégorie..."
          />
        </div>

        {/* Bouton d'ajout */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 ${
            isSubmitting ? 'opacity-70 cursor-wait' : 'hover:from-blue-700 hover:to-indigo-800'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Ajout en cours...
            </span>
          ) : (
            "Ajouter la catégorie"
          )}
        </button>
      </form>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.5s ease-out;
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in.slide-in-from-right-10 {
          animation: slideInFromRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddCategorieForm;