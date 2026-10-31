// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuIcon, XIcon } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleConnexionClick = (): void => {
    navigate("/signin");
  };

  const handleSinscrireClick = (): void => {
    navigate("/signup");
  };

  const handleAcceuilClick = (): void => {
    navigate("/acceuil");
  };

  const handleAproposClick = (): void => {
    navigate("/apropos");
  };

  return (
    <nav className="bg-white shadow-sm border-b fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center justify-center">
                <div 
                  className="w-[7vh] h-[7vh] rounded-full cursor-pointer transition-transform hover:scale-105 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                  onClick={handleAcceuilClick}
                >
              <img src="/images/Touramancy.jpeg" alt="Logo Touramancy" 
              className="w-full h-full object-cover rounded-full" />
                </div>
              </div>
            <span className="ml-3 text-xl font-bold text-gray-900">I.P.M.K</span>
          </div>
          
          {/* Menu desktop */}
          <div className="hidden md:flex justify-center items-center">
            <div className="my-5">
              <button 
                onClick={handleAcceuilClick} 
                className="text-xl text-gray-700 font-sans px-3 hover:text-orange-500 transition-colors duration-300 font-bold"
              >
                Accueil
              </button>
              <button 
                onClick={handleAproposClick} 
                className="text-xl text-gray-700 font-sans px-3 hover:text-orange-500 transition-colors duration-300 font-bold"
              >
                À propos
              </button>
            </div>
            <div className="flex gap-4 ml-6">
              {/* <button 
                onClick={handleSinscrireClick} 
                className="bg-gradient-to-r from-blue-700 to-blue-900 text-white text-[17px] rounded-full p-2 px-8 font-semibold hover:from-blue-800 hover:to-blue-950 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
              >
                S'inscrire
              </button> */}
              <button 
                onClick={handleConnexionClick} 
                className="bg-gradient-to-r from-green-600 to-green-800 text-white text-[17px] rounded-full p-2 px-8 font-semibold hover:from-green-700 hover:to-green-900 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
              >
                Connexion
              </button>
            </div>
          </div>
          
          {/* Menu mobile */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 text-gray-700 hover:text-orange-500 transition-colors"
            >
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Menu mobile ouvert */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white absolute top-16 left-0 right-0 z-40 shadow-lg border-t animate-fade-in">
            <div className="flex flex-col p-4">
              <button 
                onClick={() => {
                  handleAcceuilClick();
                  setMobileMenuOpen(false);
                }}
                className="py-3 text-lg font-medium text-left text-gray-700 hover:text-orange-500 transition-colors"
              >
                Accueil
              </button>
              <button 
                onClick={() => {
                  handleAproposClick();
                  setMobileMenuOpen(false);
                }}
                className="py-3 text-lg font-medium text-left text-gray-700 hover:text-orange-500 transition-colors"
              >
                À propos
              </button>
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                {/* <button 
                  onClick={() => {
                    handleSinscrireClick();
                    setMobileMenuOpen(false);
                  }} 
                  className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-full p-3 font-semibold hover:from-blue-800 hover:to-blue-950 transition-all"
                >
                  S'inscrire
                </button> */}
                <button 
                  onClick={() => {
                    handleConnexionClick();
                    setMobileMenuOpen(false);
                  }} 
                  className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-full p-3 font-semibold hover:from-green-700 hover:to-green-900 transition-all"
                >
                  Connexion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animation CSS pour le menu mobile */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Header;