// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus, RefreshCw, CheckCircle, XCircle, X,
  User, Phone, Mail, MapPin, IdCard, ShieldCheck,
  Upload, Image as ImageIcon, Trash2, UserCheck
} from "lucide-react";
import api from "../../config/axiosConfig";

// ==================== NOTIFICATION ====================
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    success: { bg: "from-emerald-500 to-green-600", icon: <CheckCircle size={20} /> },
    error:   { bg: "from-red-500 to-rose-600",       icon: <XCircle size={20} /> },
    info:    { bg: "from-blue-500 to-indigo-600",    icon: <UserPlus size={20} /> },
  }[type] || { bg: "from-red-500 to-rose-600", icon: <XCircle size={20} /> };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`bg-gradient-to-r ${config.bg} text-white rounded-2xl shadow-2xl max-w-md flex items-start p-4 gap-3`}>
        <div className="bg-white/20 rounded-xl p-2">{config.icon}</div>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// ==================== ÉTAT INITIAL ====================
const initialForm = {
  ina: "",
  matricule: "",
  nom: "",
  prenom: "",
  genre: "Homme",          // ✅ AJOUT : valeur par défaut
  telephone: "",
  email: "",
  adresse: "",
  contacts_titre_nom: "",
  contacts_titre_telephone: "",
  photo: null,
};

// ==================== COMPOSANT PRINCIPAL ====================
const AddEtudiants = ({ onSuccess, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  const resetForm = () => {
    setFormData(initialForm);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==================== PHOTO ====================
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("error", "Veuillez sélectionner une image valide");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "L'image ne doit pas dépasser 5 MB");
      return;
    }

    setFormData((prev) => ({ ...prev, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ==================== SOUMISSION ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation
    if (!formData.nom?.trim() || !formData.prenom?.trim()) {
      showNotification("error", "Le nom et le prénom sont obligatoires");
      return;
    }

    if (!formData.ina?.trim()) {
      showNotification("error", "L'INA est obligatoire");
      return;
    }

    // ✅ Validation genre
    if (!formData.genre || !["Homme", "Femme"].includes(formData.genre)) {
      showNotification("error", "Veuillez sélectionner le genre (Homme ou Femme)");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("ina", formData.ina.trim());
      fd.append("nom", formData.nom.trim());
      fd.append("prenom", formData.prenom.trim());
      fd.append("matricule", formData.matricule?.trim() || "");
      fd.append("genre", formData.genre);   // ✅ CORRIGÉ : plus en dur

      fd.append(
        "contacts",
        JSON.stringify({
          telephone: formData.telephone?.trim() || null,
          email: formData.email?.trim() || null,
          adresse: formData.adresse?.trim() || null,
        })
      );

      fd.append(
        "contacts_titre",
        JSON.stringify({
          nom: formData.contacts_titre_nom?.trim() || null,
          telephone: formData.contacts_titre_telephone?.trim() || null,
        })
      );

      if (formData.photo) {
        fd.append("photo", formData.photo);
      }

      const response = await api.post("/api/allroute/etudiant/ajout", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Étudiant ajouté:", response.data);

      showNotification(
        "success",
        response?.data?.message || "Étudiant ajouté avec succès !"
      );

      resetForm();

      setTimeout(() => {
        onSuccess?.();
      }, 800);
    } catch (error) {
      console.error("❌ Erreur ajout étudiant:", error);

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur lors de l'ajout de l'étudiant";

      showNotification("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
            <UserPlus size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Ajouter un nouvel étudiant
            </h2>
            <p className="text-blue-100 text-sm">
              Remplissez les informations essentielles
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* ===== IDENTITÉ ===== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-blue-500" />
                Identité
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* INA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <IdCard size={14} className="text-gray-400" />
                  INA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ina"
                  value={formData.ina}
                  onChange={handleChange}
                  placeholder="Identifiant unique"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              {/* Matricule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <IdCard size={14} className="text-gray-400" />
                  Matricule
                </label>
                <input
                  type="text"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleChange}
                  placeholder="Auto si vide"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Diallo"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Ousmane"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {/* ✅ GENRE — sélecteur Homme / Femme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <UserCheck size={14} className="text-gray-400" />
                Genre <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                {/* Bouton Homme */}
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, genre: "Homme" }))}
                  className={`flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all border-2 ${
                    formData.genre === "Homme"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 shadow-lg scale-[1.02]"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.genre === "Homme" ? "bg-white/20" : "bg-blue-100"
                    }`}
                  >
                    <User
                      size={20}
                      className={formData.genre === "Homme" ? "text-white" : "text-blue-600"}
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold">Homme</div>
                    <div
                      className={`text-xs ${
                        formData.genre === "Homme" ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      Masculin
                    </div>
                  </div>
                  {formData.genre === "Homme" && (
                    <CheckCircle size={20} className="text-white ml-auto" />
                  )}
                </button>

                {/* Bouton Femme */}
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, genre: "Femme" }))}
                  className={`flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all border-2 ${
                    formData.genre === "Femme"
                      ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-600 shadow-lg scale-[1.02]"
                      : "bg-white text-gray-700 border-gray-200 hover:border-pink-400 hover:bg-pink-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.genre === "Femme" ? "bg-white/20" : "bg-pink-100"
                    }`}
                  >
                    <User
                      size={20}
                      className={formData.genre === "Femme" ? "text-white" : "text-pink-600"}
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold">Femme</div>
                    <div
                      className={`text-xs ${
                        formData.genre === "Femme" ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      Féminin
                    </div>
                  </div>
                  {formData.genre === "Femme" && (
                    <CheckCircle size={20} className="text-white ml-auto" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* PHOTO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-pink-500 to-rose-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-pink-500" />
                Photo de l'étudiant
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                      title="Supprimer la photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center border-2 border-dashed border-pink-300">
                    <ImageIcon size={32} className="text-pink-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-pink-300 rounded-2xl cursor-pointer bg-pink-50 hover:bg-pink-100 transition-all"
                >
                  <Upload size={22} className="text-pink-500" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-pink-700">
                      {formData.photo ? formData.photo.name : "Choisir une photo"}
                    </p>
                    <p className="text-xs text-pink-500">
                      JPG, PNG · max 5 MB
                    </p>
                  </div>
                </label>
                <input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* COORDONNÉES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Phone size={18} className="text-emerald-500" />
                Coordonnées
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" />
                  Téléphone
                  <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+224 600 00 00 00"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Mail size={14} className="text-gray-400" />
                  Email
                  <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="etudiant@gmail.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  Adresse
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Conakry, Guinée"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* CONTACT DU TITULAIRE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-500" />
                Contact du titulaire
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Tuteur
                </label>
                <input
                  type="text"
                  name="contacts_titre_nom"
                  value={formData.contacts_titre_nom}
                  onChange={handleChange}
                  placeholder="Ex: Mamadou Diallo"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone du Tuteur
                </label>
                <input
                  type="text"
                  name="contacts_titre_telephone"
                  value={formData.contacts_titre_telephone}
                  onChange={handleChange}
                  placeholder="+224 620 00 00 00"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOUTONS */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancel?.();
            }}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-100 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Enregistrer l'étudiant
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
      `}</style>
    </>
  );
};

export default AddEtudiants;