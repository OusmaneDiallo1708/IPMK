// @ts-nocheck
import axios from "axios";
import { Lock, Mail, UserCircleIcon, Eye, EyeOff, User } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// =======================
// 📌 Configuration API URL (EN DUR POUR PRODUCTION)
// =======================
const API_URL = "https://touramancy2026.onrender.com";

interface SignUpFormProps {
  setIsLogin: (val: boolean) => void;
}

interface ApiResponse {
  message?: string;
  utilisateur?: {
    _id: string;
    nomComplet: string;
    email: string;
  };
}

const SignUpForm: React.FC<SignUpFormProps> = ({ setIsLogin }) => {
  const navigate = useNavigate();

  const [nomComplet, setNomComplet] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [motDePasse, setMotDePasse] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirme, setConfirme] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Messages d'erreurs
  const [nomCompletErreur, setNomCompletErreur] = useState<string>("");
  const [emailErreur, setEmailErreur] = useState<string>("");
  const [motDePasseErreur, setMotDePasseErreur] = useState<string>("");
  const [confirmeErreur, setConfirmeErreur] = useState<string>("");
  const [erreurGenerale, setErreurGenerale] = useState<string>("");

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleResister = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    // reset erreurs
    setNomCompletErreur("");
    setEmailErreur("");
    setMotDePasseErreur("");
    setConfirmeErreur("");
    setErreurGenerale("");

    let hasError = false;
    
    if (!nomComplet) {
      setNomCompletErreur("Le nom complet est requis.");
      hasError = true;
    }
    
    if (!email) {
      setEmailErreur("L'email est requis.");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailErreur("Veuillez entrer un email valide.");
      hasError = true;
    }
    
    if (!motDePasse) {
      setMotDePasseErreur("Le mot de passe est requis.");
      hasError = true;
    } else if (motDePasse.length < 6) {
      setMotDePasseErreur("Le mot de passe doit contenir au moins 6 caractères.");
      hasError = true;
    }
    
    if (!confirme) {
      setConfirmeErreur("Veuillez confirmer votre mot de passe.");
      hasError = true;
    } else if (motDePasse !== confirme) {
      setConfirmeErreur("Les mots de passe ne correspondent pas.");
      hasError = true;
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post<ApiResponse>(
        `${API_URL}/api/utilisateur/ajoutUtilisateur`,
        { nomComplet, email, motDePasse },
        { withCredentials: true }
      );
      console.log("Inscription réussie :", res.data);

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setNomComplet("");
        setEmail("");
        setMotDePasse("");
        setConfirme("");
        setIsLogin(true);
      }, 3000);
      
    } catch (error: any) {
      console.log("Erreur d'inscription :", error.response?.data || error.message);
      
      if (error.response?.status === 409) {
        setErreurGenerale("Cet email est déjà utilisé.");
      } else if (error.code === 'ERR_CONNECTION_REFUSED') {
        setErreurGenerale("Impossible de contacter le serveur. Vérifiez que le backend est démarré.");
      } else {
        setErreurGenerale("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[60vh] relative">
      {showSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-4/5">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">Inscription réussie! Veuillez patienter...</span>
          </div>
        </div>
      )}
      
      <div className="bg-white py-16 shadow-xl p-8 rounded-tl-[18vh]">
        <div className="text-center mb-6">
          <div className="flex justify-center items-center">
            <UserCircleIcon className="text-green-600" size={42} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">S'inscrire</h1>
          <p className="text-gray-600">Créer votre espace personnel</p>
        </div>
        
        <form className="space-y-4" id="SignUpForm" onSubmit={handleResister}>
          {erreurGenerale && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {erreurGenerale}
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={nomComplet}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomComplet(e.target.value)}
              placeholder="Nom et Prénom"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 
              focus:ring-green-600 focus:border-green-600 transition-all duration-200 ${
                nomCompletErreur ? "border-red-500" : "border-gray-200"
              }`}
            />
            {nomCompletErreur && <p className="text-red-500 text-xs mt-1">{nomCompletErreur}</p>}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 
              focus:ring-green-600 focus:border-green-600 transition-all duration-200 ${
                emailErreur ? "border-red-500" : "border-gray-200"
              }`}
            />
            {emailErreur && <p className="text-red-500 text-xs mt-1">{emailErreur}</p>}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={motDePasse}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMotDePasse(e.target.value)}
              placeholder="Mot de passe"
              className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200 ${
                motDePasseErreur ? "border-red-500" : "border-gray-200"
              }`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {motDePasseErreur && <p className="text-red-500 text-xs mt-1">{motDePasseErreur}</p>}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={confirme}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirme(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200 ${
                confirmeErreur ? "border-red-500" : "border-gray-200"
              }`}
            />
            {confirmeErreur && <p className="text-red-500 text-xs mt-1">{confirmeErreur}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-950 to-green-800 text-white py-2 rounded-lg font-semibold hover:from-blue-900 
            hover:to-green-900 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Inscription...
              </span>
            ) : "Inscription"}
          </button>
          
          <div className="relative flex items-center mt-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-600 text-sm">Ou</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <button
            type="button"
            disabled={isLoading}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold 
            hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Vous avez déjà un compte?{" "}
            <button 
              onClick={() => setIsLogin(true)} 
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;