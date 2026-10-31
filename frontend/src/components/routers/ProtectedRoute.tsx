// @ts-nocheck
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../log/context/UserContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();

  // Si pas d'utilisateur connecté → redirection vers la page d'accueil
  if (!user) {
    return <Navigate to="/acceuil" state={{ from: location }} replace />;
  }

  // Sinon, on affiche le composant protégé
  return <>{children}</>;
};

export default ProtectedRoute;