// @ts-nocheck
import { useState } from "react";
import CategorieAdd from "./CategorieAdd";
import { BiAddToQueue } from "react-icons/bi";

const BtnCategorie: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOpenModal = (): void => {
    setIsOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsOpen(false);
  };

  return (
    <div>
      <button
        className="flex justify-center items-center gap-2 text-xl text-white bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        onClick={handleOpenModal}
      >
        <BiAddToQueue size={24} />
        Ajouter une catégorie
      </button>

      {/* Modal stylisé comme dans CategorieListes */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden transform animate-scale-in">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                Ajouter une catégorie
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Corps du modal */}
            <div className="p-6">
              <CategorieAdd />
            </div>
            
            {/* Pied du modal */}
            <div className="flex justify-end p-6 pt-0 border-t border-gray-100 mt-4">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BtnCategorie;