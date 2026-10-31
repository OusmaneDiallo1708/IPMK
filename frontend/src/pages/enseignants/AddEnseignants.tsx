// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus, RefreshCw, CheckCircle, XCircle, X,
  User, Phone, Mail, MapPin, IdCard,
  BookOpen, Clock, FileText, Calendar, Plus, ChevronDown
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

// ==================================================
// ============ DYNAMIC SELECT ======================
// ==================================================
const DynamicSelect = ({
  label, icon, storageKey, value, onChange,
  placeholder = "Sélectionner...", required = false, inputType = "text",
}) => {
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setOptions(JSON.parse(stored));
    } catch { setOptions([]); }
  }, [storageKey]);

  const saveOptions = (newOpts) => {
    setOptions(newOpts);
    localStorage.setItem(storageKey, JSON.stringify(newOpts));
  };

  const handleAdd = () => {
    const v = newOption.trim();
    if (!v) return;
    if (options.includes(v)) {
      setNewOption(""); setAdding(false); onChange(v); setIsOpen(false);
      return;
    }
    const newOpts = [...options, v];
    saveOptions(newOpts);
    onChange(v); setNewOption(""); setAdding(false); setIsOpen(false);
  };

  const handleDelete = (opt, e) => {
    e.stopPropagation();
    const newOpts = options.filter((o) => o !== opt);
    saveOptions(newOpts);
    if (value === opt) onChange("");
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false); setAdding(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-amber-400 focus:ring-2 focus:ring-amber-500 outline-none transition"
        >
          <span className={value ? "text-gray-800" : "text-gray-400 truncate"}>
            {value || placeholder}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <button
          type="button"
          onClick={() => { setAdding(true); setIsOpen(true); }}
          className="px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center"
          title="Ajouter une option"
        >
          <Plus size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {adding && (
            <div className="p-2 border-b border-gray-100 flex gap-2 sticky top-0 bg-white">
              <input
                autoFocus
                type={inputType}
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
                  if (e.key === "Escape") { setAdding(false); setNewOption(""); }
                }}
                placeholder="Nouvelle option..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button type="button" onClick={handleAdd} className="px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold">
                OK
              </button>
            </div>
          )}

          {options.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Aucune option. Cliquez sur <Plus size={12} className="inline" /> pour ajouter.
            </div>
          ) : (
            options.map((opt) => (
              <div
                key={opt}
                className={`flex items-center justify-between px-3 py-2 hover:bg-amber-50 cursor-pointer group transition ${value === opt ? "bg-amber-100" : ""}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                <span className="text-sm text-gray-700 truncate">{opt}</span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(opt, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition shrink-0"
                  title="Supprimer"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================================================
// ===== 🆕 COMPOSANT : MULTI-MATIÈRES ==============
// ==================================================
const MultiMatieres = ({ matieres = [], onChange }) => {
  const [nouvelle, setNouvelle] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef(null);

  // Charger les suggestions depuis localStorage (matières déjà utilisées)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("options_matieres");
      if (stored) setSuggestions(JSON.parse(stored));
    } catch {}
  }, []);

  const saveSuggestion = (m) => {
    const newSug = Array.from(new Set([...suggestions, m]));
    setSuggestions(newSug);
    localStorage.setItem("options_matieres", JSON.stringify(newSug));
  };

  const ajouterMatiere = () => {
    const m = nouvelle.trim();
    if (!m) return;
    if (matieres.some(x => x.toLowerCase() === m.toLowerCase())) {
      setNouvelle("");
      return;
    }
    onChange([...matieres, m]);
    saveSuggestion(m);
    setNouvelle("");
    setShowSuggestions(false);
  };

  const supprimerMatiere = (m) => {
    onChange(matieres.filter(x => x !== m));
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filteredSuggestions = suggestions.filter(
    (s) => !matieres.includes(s) &&
      (nouvelle === "" || s.toLowerCase().includes(nouvelle.toLowerCase()))
  );

  return (
    <div ref={ref} className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
        <BookOpen size={14} className="text-gray-400" />
        Matière(s) enseignée(s)
        <span className="text-xs text-gray-400 font-normal">(une ou plusieurs)</span>
      </label>

      {/* Badges des matières ajoutées */}
      {matieres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-amber-50 rounded-xl border border-amber-200 min-h-[46px]">
          {matieres.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-semibold shadow-sm"
            >
              <BookOpen size={12} />
              {m}
              <button
                type="button"
                onClick={() => supprimerMatiere(m)}
                className="ml-1 p-0.5 hover:bg-white/30 rounded-full transition"
                title="Retirer"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + bouton + */}
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
          <input
            type="text"
            value={nouvelle}
            onChange={(e) => { setNouvelle(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); ajouterMatiere(); }
            }}
            placeholder="Ex: Mathématiques, Physique..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <button
          type="button"
          onClick={ajouterMatiere}
          disabled={!nouvelle.trim()}
          className="px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          title="Ajouter cette matière"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Ajouter</span>
        </button>

        {/* Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
            <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">Suggestions</div>
            {filteredSuggestions.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange([...matieres, s]);
                  setNouvelle("");
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-2"
              >
                <BookOpen size={12} className="text-amber-500" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
        💡 Tapez une matière puis cliquez sur <strong>Ajouter</strong> ou appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Entrée</kbd>
      </p>
    </div>
  );
};

// ==================== ÉTAT INITIAL ====================
const initialForm = {
  matricule: "",
  nom: "",
  prenom: "",
  genre: "",
  adresse: "",
  telephone: "",
  matieres: [],           // ✅ tableau de matières
  heures: "",
  email: "",
  dateAjout: new Date().toLocaleDateString("fr-CA"),
};

// ==================== COMPOSANT PRINCIPAL ====================
const AddEnseignants = ({ onSuccess, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [cvFile, setCvFile] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  const resetForm = () => {
    setFormData(initialForm);
    setCvFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCvChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom?.trim() || !formData.prenom?.trim()) {
      showNotification("error", "Le nom et le prénom sont obligatoires");
      return;
    }

    if (formData.matieres.length === 0) {
      showNotification("error", "Ajoutez au moins une matière");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("matricule", formData.matricule?.trim() || "");
      fd.append("nom", formData.nom.trim());
      fd.append("prenom", formData.prenom.trim());
      fd.append("genre", formData.genre || "");
      fd.append("adresse", formData.adresse || "");
      fd.append("telephone", formData.telephone || "");
      fd.append("matieres", JSON.stringify(formData.matieres));  // ✅ tableau JSON
      fd.append("matiere", formData.matieres[0] || "");           // compatibilité
      fd.append("heures", formData.heures || "");
      fd.append("email", formData.email || "");
      fd.append("dateAjout", formData.dateAjout || "");

      if (cvFile) {
        fd.append("cv", cvFile);
      }

      const response = await api.post("/api/allroute/enseignant/ajout", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Enseignant ajouté:", response.data);

      showNotification(
        "success",
        response?.data?.message || "Enseignant ajouté avec succès !"
      );

      resetForm();
      setTimeout(() => onSuccess?.(), 800);
    } catch (error) {
      console.error("❌ Erreur ajout enseignant:", error);
      const msg = error?.response?.data?.message || error?.message || "Erreur lors de l'ajout";
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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
            <UserPlus size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Ajouter un nouvel enseignant</h2>
            <p className="text-blue-100 text-sm">Remplissez les informations essentielles</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* IDENTITÉ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-blue-500" /> Identité
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <IdCard size={14} className="text-gray-400" /> Matricule
                </label>
                <input type="text" name="matricule" value={formData.matricule} onChange={handleChange}
                  placeholder="Auto si vide"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom <span className="text-red-500">*</span></label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange}
                  placeholder="Diallo" required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom <span className="text-red-500">*</span></label>
                <input type="text" name="prenom" value={formData.prenom} onChange={handleChange}
                  placeholder="Ousmane" required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <select name="genre" value={formData.genre} onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                  <option value="">-- Sélectionner --</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> Adresse
                </label>
                <input type="text" name="adresse" value={formData.adresse} onChange={handleChange}
                  placeholder="Conakry, Guinée"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* COORDONNÉES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Phone size={18} className="text-emerald-500" /> Coordonnées
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" /> Téléphone
                </label>
                <input type="text" name="telephone" value={formData.telephone} onChange={handleChange}
                  placeholder="+224 600 00 00 00"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Mail size={14} className="text-gray-400" /> Email
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="enseignant@gmail.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>

          {/* INFORMATIONS PROFESSIONNELLES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen size={18} className="text-amber-500" /> Informations professionnelles
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ✅ MULTI-MATIÈRES AVEC BOUTON + */}
              <MultiMatieres
                matieres={formData.matieres}
                onChange={(matieres) => setFormData((f) => ({ ...f, matieres }))}
              />

              {/* Heures */}
              <DynamicSelect
                label="Heures"
                icon={<Clock size={14} className="text-gray-400" />}
                storageKey="options_heures"
                value={formData.heures}
                onChange={(v) => setFormData((f) => ({ ...f, heures: v }))}
                placeholder="Ex: 20h/semaine"
                inputType="text"
              />
            </div>
          </div>

          {/* CV & DATE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-purple-500" /> CV & Date d'ajout
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FileText size={14} className="text-gray-400" /> CV (PDF)
                </label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 file:font-semibold hover:file:bg-purple-200 file:cursor-pointer" />
                {cvFile && <p className="text-xs text-green-600 mt-1">✅ {cvFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" /> Date d'ajout
                </label>
                <input type="date" name="dateAjout" value={formData.dateAjout} onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* BOUTONS */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={() => { resetForm(); onCancel?.(); }}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-100 transition-all">
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (
              <><RefreshCw size={18} className="animate-spin" /> Enregistrement...</>
            ) : (
              <><UserPlus size={18} /> Enregistrer l'enseignant</>
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

export default AddEnseignants;