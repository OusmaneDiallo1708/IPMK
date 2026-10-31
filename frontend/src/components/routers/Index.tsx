// @ts-nocheck
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../../pages/Home";
import Profil from "../../pages/Profil";
import SignInForm from "../../components/log/SignInForm";
import SignUpForm from "../../components/log/SignUpForm";
import ProtectedRoute from "./ProtectedRoute";
import Acceuil from "../../home/pages/Acceuil";
import Apropos from "../../home/pages/Apropos";
import Header from "../../home/pages/Header";

interface IndexProps {
  // Props si nécessaire
}

const Index: React.FC<IndexProps> = () => {
  return (
    <Routes>
      <Route path="/signin" element={<SignInForm setIsSingUp={() => {}} />} />
      <Route path="/signup" element={<SignUpForm setIsLogin={() => {}} />} />
      <Route path="/acceuil" element={<Acceuil />} />
      <Route path="/profil" element={<Profil />} />
      <Route path="/apropos" element={<Apropos />} />
      <Route path="/header" element={<Header />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default Index;