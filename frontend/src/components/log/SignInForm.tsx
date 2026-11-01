// @ts-nocheck
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Key, Eye, EyeOff, Mail, Lock, XCircle, CheckCircle } from "lucide-react";
import { useUser } from "../../components/log/context/UserContext";

// =======================
// 📌 Configuration API URL
// =======================
// Vite lit VITE_API_URL depuis Vercel (Settings → Environment Variables)
// Fallback local si la variable n'est pas définie (dev sur ton PC)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4999";

console.log("🔧 API_BASE_URL =", API_URL);
console.log("🌐 Mode:", import.meta.env.MODE);

interface SignInFormProps {
  setIsSingUp: (val: boolean) => void;
}

interface FieldErrors {
  email: string;
  motDepasse: string;
}

interface ApiResponse {
  utilisateur?: {
    _id: string;
    nomComplet: string;
    email: string;
    role?: string;
    photo?: string;
  };
  token?: string;
  message?: string;
}

const SignInForm: React.FC<SignInFormProps> = ({ setIsSingUp }) => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>("");
  const [motDepasse, setMotDepasse] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: "",
    motDepasse: ""
  });

  const showNotificationMessage = (message: string, type: "success" | "error"): void => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {
      email: "",
      motDepasse: ""
    };
    
    let isValid = true;
    
    if (!email) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Format d'email invalide";
      isValid = false;
    }
    
    if (!motDepasse) {
      errors.motDepasse = "Le mot de passe est requis";
      isValid = false;
    } else if (motDepasse.length < 6) {
      errors.motDepasse = "Le mot de passe doit contenir au moins 6 caractères";
      isValid = false;
    }
    
    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotificationMessage("Veuillez corriger les erreurs dans le formulaire", "error");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/api/utilisateur/connexion`,
        { email, motDePasse: motDepasse },
        { withCredentials: true }
      );

      if (response.data?.utilisateur) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          console.log("✅ Token stocké dans localStorage");
        }
        
        localStorage.setItem('utilisateur', JSON.stringify(response.data.utilisateur));
        setUser(response.data.utilisateur);
        
        showNotificationMessage("Connexion réussie! Veuillez patienter...", "success");
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError("Identifiants invalides");
        showNotificationMessage("Identifiants invalides", "error");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Erreur de connexion";
      setError(errorMessage);
      showNotificationMessage(errorMessage, "error");
      console.error("❌ Erreur de connexion:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSignUp = (): void => {
    setIsSingUp(true);
    setMode('register');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-[60vh] relative">
        {showNotification && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-4/5 animate-fade-in-down ${
            notificationType === "success" 
              ? "bg-gradient-to-r from-green-500 to-green-600" 
              : "bg-gradient-to-r from-red-500 to-red-600"
          } text-white p-4 rounded-lg shadow-lg flex items-center justify-between`}>
            <div className="flex items-center">
              {notificationType === "success" ? (
                <CheckCircle className="w-6 h-6 mr-2" />
              ) : (
                <XCircle className="w-6 h-6 mr-2" />
              )}
              <span className="font-medium">{notificationMessage}</span>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-gray-200 ml-4"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="relative bg-white/95 backdrop-blur-sm py-[11.3vh] shadow-2xl p-8 overflow-hidden">
          {/* ✨ Décoration animée en arrière-plan */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative text-center mb-8">
            <div className="relative w-28 h-28 mx-auto mb-5">
              {/* 🌟 Halo lumineux animé autour du logo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-40 blur-xl animate-pulse"></div>
              {/* 🖼️ Logo */}
              <div className="relative w-full h-full rounded-full overflow-hidden 
              flex items-center justify-center ring-4 ring-white shadow-2xl
              bg-gradient-to-r from-blue-600 to-green-600 p-[3px]
              transition-transform duration-500 hover:scale-105">
                <img 
                  src="/images/Touramancy.jpeg" 
                  alt="Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* 🏷️ Titre stylisé avec dégradé */}
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-950 via-blue-800 to-green-700 
            bg-clip-text text-transparent mb-2 tracking-tight">
              Se Connecter
            </h1>
            <p className="text-gray-500 text-sm">Accédez à votre espace personnel</p>

            {/* ➖ Ligne décorative sous le titre */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="h-[2px] w-10 bg-gradient-to-r from-transparent to-blue-500"></span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="h-[2px] w-10 bg-gradient-to-l from-transparent to-green-500"></span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 transition-colors ${email ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors({...fieldErrors, email: ""});
                  }
                }}
                placeholder="Adresse email"
                className={`w-full pl-10 pr-4 py-3 bg-gray-50/70 border-2 rounded-xl 
                focus:ring-4 focus:ring-green-500/20 focus:border-green-600 focus:bg-white
                transition-all duration-300 outline-none ${
                  fieldErrors.email ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                }`}
                required
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <XCircle className="w-3 h-3 mr-1" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 transition-colors ${motDepasse ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={motDepasse}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setMotDepasse(e.target.value);
                  if (fieldErrors.motDepasse) {
                    setFieldErrors({...fieldErrors, motDepasse: ""});
                  }
                }}
                placeholder="Mot de passe"
                className={`w-full pl-10 pr-12 py-3 bg-gray-50/70 border-2 rounded-xl 
                focus:ring-4 focus:ring-green-500/20 focus:border-green-600 focus:bg-white
                transition-all duration-300 outline-none ${
                  fieldErrors.motDepasse ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                }`}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-green-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-green-600 transition-colors" />
                )}
              </button>
              {fieldErrors.motDepasse && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <XCircle className="w-3 h-3 mr-1" />
                  {fieldErrors.motDepasse}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full bg-gradient-to-r from-blue-950 via-blue-900 to-green-800 
              text-white py-3 rounded-xl font-semibold overflow-hidden
              hover:from-blue-900 hover:via-blue-800 hover:to-green-700
              transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-green-600/30
              hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {/* 🌟 Effet de brillance au survol */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full 
              transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
              
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion...
                  </>
                ) : "Se Connecter"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInForm;