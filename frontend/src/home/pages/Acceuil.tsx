// @ts-nocheck
import Header from "./Header";
import Footer from "./Footer";
import Carousel from "./Carousel";

interface AcceuilProps {
  // Props si nécessaire
}

const Acceuil: React.FC<AcceuilProps> = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header/>
      
      {/* Contenu principal */}
      <div className="pt-16">
        {/* Bannière hero */}
        <div 
          className="min-h-screen bg-cover bg-center relative flex flex-col items-center justify-center text-white text-center px-4 py-20"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url('/upload/HKsKdYfLwcmzn14ev-vv4.png')`,
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Animation d'entrée */}
          <div className="animate-fade-in-up">
  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
    Bienvenue sur <span className="text-orange-400 animate-pulse-slow">I.P.M.K</span>
  </h1>
  
  <div className="w-40 h-1.5 bg-orange-500 mx-auto mb-10"></div>
  
  <p className="text-2xl md:text-3xl lg:text-4xl mb-8 max-w-4xl mx-auto font-light leading-relaxed">
    {/* Votre partenaire de confiance dans le <span className="text-orange-300 font-semibold">commerce industriel</span>,  */}
    {/* l'<span className="text-orange-300 font-semibold">immobilier</span> et le <span className="text-orange-300 font-semibold">BTP</span> <span className="text-gray-400 text-xl md:text-2xl">(Bâtiment et Travaux Publics)</span>. */}
  </p>
  
  <div className="flex flex-wrap justify-center gap-4 mb-8 text-lg md:text-xl text-gray-300 max-w-4xl mx-auto">
    <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">🚗 Véhicules (Bruxelles)</span>
    <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">🛏️ Matelas (Canada)</span>
    <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">📺 Écrans TCL • Samsung • LG</span>
    <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">🏢 Appartements meublés (Matam)</span>
  </div>
  
  {/* <p className="text-xl md:text-2xl lg:text-3xl text-orange-300 font-medium max-w-3xl mx-auto">
    ⏱️ À seulement <span className="font-bold text-white">7 minutes de l'aéroport international</span> de Conakry
  </p> */}
  
  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
  </div>
</div>
          
          {/* Indicateur de défilement */}
          <div className="absolute bottom-10 animate-bounce">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
        
        {/* Affichage des produits selon la section active */}
        {/* <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 gap-8">
            <Carousel/>
          </div>
        </div> */}
        
        <Footer/>
      </div>
      
      {/* Styles CSS intégrés */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseSlow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 1.5s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 3s infinite;
        }
        
        .animate-bounce {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Acceuil;