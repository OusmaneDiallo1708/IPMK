
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleCreateAccount = (): void => {
    navigate("/signup");
  };

  const handleDiscoverMarketplace = (): void => {
    navigate("/acceuil");
  };

  return (
    <div>
      {/* CTA Final */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à rejoindre l'aventure ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Rejoignez des milliers d'acheter qui font déjà confiance à Touramancy
          </p> */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <button 
              onClick={handleCreateAccount}
              className="bg-orange-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Créer mon compte
            </button> */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Footer;