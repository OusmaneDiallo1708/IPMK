// @ts-nocheck
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LogOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async (): Promise<void> => {
      try {
        const response = await axios.get("http://localhost:4999/api/utilisateur/logout", {
          withCredentials: true,
        });

        if (response.status === 200) {
          localStorage.removeItem('token');
          localStorage.removeItem('utilisateur');
          navigate("/login");
        }
      } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
        // En cas d'erreur, rediriger quand même
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');
        navigate("/login");
      }
    };

    logout();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">Déconnexion en cours...</p>
        <p className="text-gray-500 text-sm mt-2">Vous allez être redirigé</p>
      </div>
    </div>
  );
};

export default LogOut;