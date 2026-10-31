// @ts-nocheck
import React from "react";
import Log from "../components/log/Log";
import { UserProvider } from "../components/log/context/UserContext";

const Profil: React.FC = () => {
  return (
    <UserProvider>
      <div 
        className="bg-green-600 rounded-lg focus:ring-2 transition-all duration-200 min-h-screen flex justify-center items-center"
        style={{ backgroundImage: `url("/upload/HKsKdYfLwcmzn14ev-vv4.png")` }}
      >
        <div className="flex bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Section gauche - Branding */}
          <div className="flex flex-col w-96 items-center justify-center bg-gradient-to-br from-blue-900 to-blue-950 p-8 rounded-br-[18vh] rounded-tl-xl">
            <h1 className="text-3xl text-white font-bold text-center mb-4">
              Bienvenue Sur <span className="text-orange-400">IMPK(Institut Professionnel de Kigali Mourani Kaba)</span>
            </h1>
            <img 
              src="/images/Logo_WS.png" 
              className="w-32 h-32 object-contain mb-4 filter brightness-125 drop-shadow-lg" 
              alt="Logo Whalleïn Stock" 
            />
            <p className="text-xl text-blue-200 italic text-center">
              Vos ambitions sont notre priorité
            </p>
            
            {/* Séparateur décoratif */}
            <div className="w-16 h-1 bg-orange-500 rounded-full mt-8"></div>
            
            {/* Petite description supplémentaire */}
            <p className="text-sm text-blue-300 text-center mt-6">
              La marketplace qui révolutionne votre expérience d'achat
            </p>
          </div>
          
          {/* Section droite - Formulaire */}
          <div className="flex items-center justify-center">
            <Log />
          </div>
        </div>
      </div>
    </UserProvider>
  );
};

export default Profil; // Fichier corrigé le 19/05/2026