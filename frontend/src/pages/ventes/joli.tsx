import React, { useState, useEffect } from "react";
import axios from "axios";

// ========== DÉFINITIONS DES TYPES ==========
interface Produit {
  _id: string;
  produitNom?: string;
  nom?: string;
  produitDescription?: string;
  description?: string;
  prix_unitaire?: number;
  prixVente?: number;
  prix?: number;
  quantite_stock?: number;
}

interface Utilisateur {
  _id: string;
  nomComplet?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  role?: string;
}

interface VenteFormData {
  produitId: string;
  utilisateurId: string;
  quantite: string;
  prix_unitaire: string;
  date_vente: string;
}

interface ApiResponse {
  message?: string;
  produits?: Produit[];
  utilisateur?: Utilisateur[];
  users?: Utilisateur[];
  data?: any[];
}

// ========== COMPOSANT PRINCIPAL ==========
const AddVenteForm: React.FC = () => {
  const [formData, setFormData] = useState<VenteFormData>({
    produitId: "",
    utilisateurId: "",
    quantite: "",
    prix_unitaire: "",
    date_vente: ""
  });
  
  const [produits, setProduits] = useState<Produit[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<Utilisateur | null>(null);

  // Charger les produits et utilisateurs depuis le backend
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // Charger les produits
        const produitsRes = await axios.get<Produit[] | ApiResponse>("http://localhost:4999/api/allroute/getAllProduit");
        console.log("Produits response:", produitsRes.data);
        
        // Charger les utilisateurs
        const usersRes = await axios.get<Utilisateur[] | ApiResponse>("http://localhost:4999/api/utilisateur/getAllUtilisateurs");
        console.log("Utilisateurs response:", usersRes.data);

        // Vérifier et formater les données produits
        let produitsData: Produit[] = [];
        if (Array.isArray(produitsRes.data)) {
          produitsData = produitsRes.data;
        } else if (produitsRes.data && Array.isArray((produitsRes.data as ApiResponse).produits)) {
          produitsData = (produitsRes.data as ApiResponse).produits!;
        } else if (produitsRes.data && Array.isArray((produitsRes.data as ApiResponse).data)) {
          produitsData = (produitsRes.data as ApiResponse).data!;
        }
        setProduits(produitsData);

        // Vérifier et formater les données utilisateurs
        let usersData: Utilisateur[] = [];
        if (Array.isArray(usersRes.data)) {
          usersData = usersRes.data;
        } else if (usersRes.data && Array.isArray((usersRes.data as ApiResponse).utilisateur)) {
          usersData = (usersRes.data as ApiResponse).utilisateur!;
        } else if (usersRes.data && Array.isArray((usersRes.data as ApiResponse).users)) {
          usersData = (usersRes.data as ApiResponse).users!;
        } else if (usersRes.data && Array.isArray((usersRes.data as ApiResponse).data)) {
          usersData = (usersRes.data as ApiResponse).data!;
        }
        setUtilisateurs(usersData);

      } catch (err) {
        console.error("Erreur récupération des données :", err);
        setMessage("⚠️ Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    
    if (name === "produitId") {
      // Trouver le produit sélectionné
      const produit = produits.find(prod => prod._id === value);
      setSelectedProduit(produit || null);
      
      // Mettre à jour automatiquement le prix unitaire si disponible
      if (produit && (produit.prix_unitaire || produit.prixVente || produit.prix)) {
        const prixValue = produit.prix_unitaire || produit.prixVente || produit.prix;
        setFormData(prev => ({
          ...prev,
          prix_unitaire: prixValue?.toString() || ""
        }));
      }
    }
    
    if (name === "utilisateurId") {
      // Trouver l'utilisateur sélectionné
      const utilisateur = utilisateurs.find(user => user._id === value);
      setSelectedUtilisateur(utilisateur || null);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      if (!formData.produitId) {
        throw new Error("Veuillez choisir un produit.");
      }

      if (!formData.utilisateurId) {
        throw new Error("Veuillez choisir un utilisateur.");
      }

      const response = await fetch("http://localhost:4999/api/allroute/addVente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("✅ Vente ajoutée avec succès !");
        setFormData({
          produitId: "",
          utilisateurId: "",
          quantite: "",
          prix_unitaire: "",
          date_vente: ""
        });
        setSelectedProduit(null);
        setSelectedUtilisateur(null);
      } else {
        throw new Error(result.message || "Erreur lors de l'ajout de la vente.");
      }
    } catch (error) {
      console.error(error);
      setMessage(`❌ ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl mt-10 border border-blue-100">
      <h2 className="text-4xl font-bold text-blue-800 mb-8 text-center tracking-tight">
        ✨ Ajouter une Nouvelle Vente
      </h2>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-center font-medium ${message.startsWith("✅") ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        
        {/* Section Produit */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">📦 Informations Produit</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sélection du produit */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Nom du Produit</label>
              <select
                name="produitId"
                value={formData.produitId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                required
              >
                <option value="">-- Choisir un produit --</option>
                {produits.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.produitNom || prod.nom || "Sans nom"} 
                    {prod.produitDescription || prod.description ? ` - ${prod.produitDescription || prod.description}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Affichage des détails du produit sélectionné */}
            {selectedProduit && (
              <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📋 Détails du produit:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nom:</span>
                    <p>{selectedProduit.produitNom || selectedProduit.nom || "-"}</p>
                  </div>
                  {(selectedProduit.produitDescription || selectedProduit.description) && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p>{selectedProduit.produitDescription || selectedProduit.description}</p>
                    </div>
                  )}
                  {(selectedProduit.prix_unitaire || selectedProduit.prixVente || selectedProduit.prix) !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Prix unitaire:</span>
                      <p>{selectedProduit.prix_unitaire || selectedProduit.prixVente || selectedProduit.prix} €</p>
                    </div>
                  )}
                  {selectedProduit.quantite_stock !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Stock disponible:</span>
                      <p>{selectedProduit.quantite_stock}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Utilisateur */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">👤 Informations Client</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sélection de l'utilisateur */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Client</label>
              <select
                name="utilisateurId"
                value={formData.utilisateurId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                required
              >
                <option value="">-- Choisir un client --</option>
                {utilisateurs.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.nomComplet || user.nom || "Sans nom"}
                    {user.email ? ` - ${user.email}` : ''}
                    {user.telephone ? ` - ${user.telephone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Affichage des détails de l'utilisateur sélectionné */}
            {selectedUtilisateur && (
              <div className="md:col-span-2 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">👤 Informations client:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nom:</span>
                    <p>{selectedUtilisateur.nomComplet || selectedUtilisateur.nom || "-"}</p>
                  </div>
                  {selectedUtilisateur.email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p>{selectedUtilisateur.email}</p>
                    </div>
                  )}
                  {selectedUtilisateur.telephone && (
                    <div>
                      <span className="font-medium text-gray-700">Téléphone:</span>
                      <p>{selectedUtilisateur.telephone}</p>
                    </div>
                  )}
                  {selectedUtilisateur.role && (
                    <div>
                      <span className="font-medium text-gray-700">Rôle:</span>
                      <p>{selectedUtilisateur.role}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Vente */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">💰 Détails de la Vente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Quantité</label>
              <input
                type="number"
                name="quantite"
                placeholder="Ex: 5"
                value={formData.quantite}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                required
                min="1"
              />
            </div>

            {/* Prix unitaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Prix unitaire (€)</label>
              <input
                type="number"
                name="prix_unitaire"
                placeholder="Ex: 19.99"
                value={formData.prix_unitaire}
                onChange={handleChange}
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                required
                min="0"
              />
            </div>

            {/* Date de vente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Date de vente</label>
              <input
                type="date"
                name="date_vente"
                value={formData.date_vente}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                required
              />
            </div>

            {/* Calcul du total */}
            {formData.quantite && formData.prix_unitaire && (
              <div className="md:col-span-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-800">
                  Total: {(parseFloat(formData.quantite) * parseFloat(formData.prix_unitaire)).toFixed(2)} €
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="col-span-1 md:col-span-2 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
              isSubmitting 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement en cours...
              </span>
            ) : (
              "💰 Enregistrer la Vente"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVenteForm;