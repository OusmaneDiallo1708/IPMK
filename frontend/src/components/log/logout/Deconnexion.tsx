// @ts-nocheck
import { useEffect, useState } from "react";
import { LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { useUser } from "../context/UserContext";   // ✅ même chemin relatif
import api from "../../../config/axiosConfig";      // ✅ axios configuré

const Deconnexion = () => {
  const { logout } = useUser();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("Déconnexion en cours...");

  useEffect(() => {
    const performLogout = async () => {
      try {
        // 1️⃣ Tentative d'appel backend (non bloquant)
        try {
          await api.post("/api/utilisateur/logout");
        } catch (backendError) {
          console.warn("Backend logout:", backendError?.message);
        }

        // 2️⃣ ✅ Appel logout() du contexte (vide user dans UserContext)
        if (typeof logout === "function") {
          await logout();
        }

        // 3️⃣ ✅ Nettoyage COMPLET du localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("utilisateur");
        sessionStorage.clear();

        setStatus("success");
        setMessage("Déconnexion réussie !");

        // 4️⃣ ✅ Hard reload vers /profil (réinitialise tout le contexte)
        setTimeout(() => {
          window.location.href = "/profil";
        }, 1200);

      } catch (error) {
        console.error("Erreur déconnexion:", error);

        // ✅ MÊME EN CAS D'ERREUR : cleanup garanti
        localStorage.removeItem("token");
        localStorage.removeItem("utilisateur");
        sessionStorage.clear();

        setStatus("error");
        setMessage("Déconnecté avec avertissement");

        setTimeout(() => {
          window.location.href = "/profil";
        }, 1500);
      }
    };

    performLogout();
  }, [logout]);

  return (
    <div className="flex items-center justify-center h-full min-h-[70vh] px-4">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-50"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                <LogOut size={32} className="text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Déconnexion en cours
            </h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-progress"></div>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl animate-scale-in">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">À bientôt !</h2>
            <p className="text-gray-500">{message}</p>
            <p className="text-xs text-gray-400 mt-4">
              Redirection vers la page de connexion...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl animate-scale-in">
              <AlertCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Déconnecté</h2>
            <p className="text-gray-500">{message}</p>
            <p className="text-xs text-gray-400 mt-4">
              Redirection vers la page de connexion...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-progress { animation: progress 1.2s ease-in-out forwards; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Deconnexion;