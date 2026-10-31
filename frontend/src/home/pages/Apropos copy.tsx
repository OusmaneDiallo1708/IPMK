// @ts-nocheck
import React, { useState } from "react";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  Heart, 
  Award,
  Globe,
  Store,
  CheckCircle,
  ArrowRight,
  MapPin,
  Phone,
  Facebook,
  ExternalLink,
  Send,
  Truck,
  Check,
  AlertCircle,
  Loader
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

interface Stat {
  number: string;
  label: string;
  icon: React.ReactNode;
}

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Apropos: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Envoi direct vers WhatsApp de l'admin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
      return;
    }
    
    if (!formData.phone.trim()) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
      return;
    }
    
    if (!formData.message.trim()) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
      return;
    }

    setIsSubmitting(true);
    
    // Numéro WhatsApp de l'admin Touramancy
    const adminWhatsappNumber = "224620623777"; // Le numéro de l'admin
    
    // Construction du message avec emojis et mise en forme
    const message = `📩 *NOUVEAU MESSAGE TOURAMANCY* 📩%0A%0A` +
      `👤 *Nom:* ${formData.name}%0A` +
      `📞 *Téléphone:* ${formData.phone}%0A` +
      `💬 *Message:* ${formData.message}%0A%0A` +
      `🕐 *Date:* ${new Date().toLocaleString()}%0A%0A` +
      `🔔 *Répondre à ce client rapidement*`;
    
    // Lien WhatsApp direct
    const whatsappUrl = `https://wa.me/${adminWhatsappNumber}?text=${message}`;
    
    // Ouvrir WhatsApp dans un nouvel onglet
    window.open(whatsappUrl, "_blank");
    
    // Afficher le succès
    setSubmitStatus("success");
    setFormData({ name: "", phone: "", message: "" });
    
    setTimeout(() => setSubmitStatus("idle"), 3000);
    setIsSubmitting(false);
  };
  const values: Value[] = [
    {
      icon: <Shield className="w-12 h-12 text-blue-600" />,
      title: "Fiabilité",
      description: "Des produits vérifiés et un service après-vente réactif pour votre tranquillité."
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-green-600" />,
      title: "Croissance",
      description: "Nous évoluons avec nos clients pour offrir toujours plus de valeur."
    },
    {
      icon: <Globe className="w-12 h-12 text-purple-600" />,
      title: "Accessibilité",
      description: "Des produits importés de qualité à des prix compétitifs pour tous."
    },
    {
      icon: <Heart className="w-12 h-12 text-red-600" />,
      title: "Satisfaction",
      description: "Votre bonheur est notre priorité absolue."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="bg-white shadow-sm border-b fixed top-0 w-full z-50">
        <Header/>
      </nav>
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            À propos de <span className="text-orange-400">I.P.M.K</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 opacity-90">
            Votre partenaire de confiance dans le commerce industriel, l'immobilier et le BTP
          </p>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Notre Histoire</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-8"></div>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Touramancy est une entreprise dynamique évoluant dans les secteurs du commerce industriel, 
              de l'immobilier et du BTP. Basée à Conakry, nous connectons les meilleurs produits et services 
              (véhicules d'occasion, matelas, écrans neufs, appartements meublés) à nos clients, avec un engagement 
              fort sur la qualité, la transparence et le service après-vente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/images/touramancy-team.jpg" 
                alt="Équipe Touramancy" 
                className="rounded-2xl shadow-2xl w-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Touramancy';
                }}
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Notre Mission</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Offrir à nos clients des produits et logements de qualité, importés ou développés avec rigueur, 
                tout en assurant un service après-vente réactif et une satisfaction totale à chaque étape.
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Notre Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                Devenir une référence en Guinée et en Afrique de l'Ouest dans le commerce industriel, l'immobilier 
                et le BTP, en alliant fiabilité, accessibilité et innovation.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Nos valeurs */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Nos Valeurs</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-8"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-6 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos produits et services */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Nos offres <span className="text-orange-500">I.P.M.K</span></h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-8"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "🚗 Véhicules d'occasion importés de Bruxelles",
              "🛏️ Matelas neufs & d'occasion (provenance Canada)",
              "📺 Écrans Smart TV TCL, Samsung, LG",
              "🏢 Appartements meublés à Matam (7 min de l'aéroport)",
              "🔧 Service après-vente inclus",
              "📍 Siège : Bonfi, route Niger (face station BNT)"
            ].map((feature, index) => (
              <div key={index} className="flex items-start p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Formulaire de contact - Envoi direct sur WhatsApp de l'admin */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Contactez <span className="text-orange-400">Touramancy</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-8"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Envoyez votre message directement sur WhatsApp de notre équipe
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Infos de contact */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
                <MapPin className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">📍 Notre Siège</h3>
                  <p className="text-gray-200">
                    Bonfi, route Niger, en face de la station BNT<br />
                    Conakry, Guinée
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
                <Phone className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">📞 Appelez-nous</h3>
                  <p className="text-gray-200">
                    <a href="tel:+224620623777" className="hover:text-orange-400 transition">620 62 37 77</a><br />
                    <a href="tel:+224620666641" className="hover:text-orange-400 transition">620 66 66 41</a>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">WhatsApp & Appels directs</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
                <Facebook className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">📘 Suivez-nous</h3>
                  <p className="text-gray-200">
                    <a 
                      href="https://www.facebook.com/profile.php?id=100023570330761" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-orange-400 transition flex items-center gap-2"
                    >
                      Touramancy sur Facebook
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">1 200+ abonnés | Promos exclusives</p>
                </div>
              </div>
            </div>

            {/* Formulaire qui envoie sur WhatsApp admin */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Send className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">✨ Contact rapide</h3>
              </div>
              
              {/* Message de succès ou erreur */}
              {submitStatus === "success" && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-300 text-center flex items-center justify-center gap-2 animate-pulse">
                  <Check className="w-5 h-5" />
                  ✅ Message envoyé ! L'admin vous répondra sur WhatsApp
                </div>
              )}
              
              {submitStatus === "error" && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ⚠️ Veuillez remplir tous les champs
                </div>
              )}
              
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Votre nom</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Jean Paul" 
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Votre téléphone</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="612 17 64 00" 
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Votre message</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3} 
                    placeholder="Ex: Je suis intéressé par un véhicule..." 
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer sur WhatsApp
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Réponse sous 24h</span>
                  </div>
                  <span className="text-orange-400">🔒 Message sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Apropos;