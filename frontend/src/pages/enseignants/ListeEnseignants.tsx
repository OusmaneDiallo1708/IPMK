// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Users, RefreshCw, List, Search, X, CheckCircle, XCircle,
  Edit, Trash2, Eye, UserPlus, Save, AlertCircle, Info,
  User, Phone, Mail, MapPin, BookOpen, Clock, FileText, Calendar, Plus,
  Check, Pencil
} from "lucide-react";
import api from "../../config/axiosConfig";
import AddEnseignants from "./AddEnseignants";

// ==================== NOTIFICATION ÉLÉGANTE ====================
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    success: { bg: "from-emerald-500 to-green-600", icon: <CheckCircle size={20} /> },
    error:   { bg: "from-red-500 to-rose-600",       icon: <XCircle size={20} /> },
    info:    { bg: "from-blue-500 to-indigo-600",    icon: <Info size={20} /> },
    warning: { bg: "from-amber-500 to-orange-600",   icon: <AlertCircle size={20} /> },
  }[type] || { bg: "from-red-500 to-rose-600", icon: <XCircle size={20} /> };

  return (
    <div className="fixed top-6 right-6 z-[100] animate-slide-in-right">
      <div className={`bg-gradient-to-r ${config.bg} text-white rounded-2xl shadow-2xl max-w-md flex items-start p-4 gap-3 border border-white/20`}>
        <div className="bg-white/20 rounded-xl p-2">{config.icon}</div>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
    </div>
  );
};

// ==================== CHAMP RÉUTILISABLE ====================
const Field = ({ label, value, onChange, readOnly, type = "text", placeholder = "" }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {readOnly ? (
      <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 min-h-[42px]">
        {value || <span className="text-gray-400">-</span>}
      </div>
    ) : (
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
      />
    )}
  </div>
);

// ==================== MULTI-MATIÈRES ÉDITABLE (dans modal) ====================
const MultiMatieresEditable = ({ matieres = [], onChange, readOnly = false }) => {
  const [nouvelle, setNouvelle] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("options_matieres");
      if (stored) setSuggestions(JSON.parse(stored));
    } catch {}
  }, []);

  const ajouter = () => {
    const m = nouvelle.trim();
    if (!m) return;
    if (matieres.some((x) => x.toLowerCase() === m.toLowerCase())) {
      setNouvelle("");
      return;
    }
    const next = [...matieres, m];
    onChange(next);
    try {
      const stored = localStorage.getItem("options_matieres");
      const sugg = stored ? JSON.parse(stored) : [];
      const newSugg = Array.from(new Set([...sugg, m]));
      localStorage.setItem("options_matieres", JSON.stringify(newSugg));
      setSuggestions(newSugg);
    } catch {}
    setNouvelle("");
    setShowSuggestions(false);
  };

  const supprimer = (m) => onChange(matieres.filter((x) => x !== m));

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (readOnly) {
    return (
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Matière(s)
        </label>
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl min-h-[42px]">
          {matieres.length > 0 ? (
            matieres.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200"
              >
                <BookOpen size={10} /> {m}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      </div>
    );
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !matieres.includes(s) &&
      (nouvelle === "" || s.toLowerCase().includes(nouvelle.toLowerCase()))
  );

  return (
    <div ref={ref} className="md:col-span-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
        Matière(s) enseignée(s)
      </label>

      {matieres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-amber-50 rounded-xl border border-amber-200 min-h-[46px]">
          {matieres.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-semibold shadow-sm"
            >
              <BookOpen size={10} /> {m}
              <button
                type="button"
                onClick={() => supprimer(m)}
                className="ml-0.5 p-0.5 hover:bg-white/30 rounded-full transition"
                title="Retirer"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <BookOpen
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
          />
          <input
            type="text"
            value={nouvelle}
            onChange={(e) => {
              setNouvelle(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ajouter();
              }
            }}
            placeholder="Ex: Mathématiques, Physique..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
          />
        </div>
        <button
          type="button"
          onClick={ajouter}
          disabled={!nouvelle.trim()}
          className="px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <Plus size={16} /> Ajouter
        </button>

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
    </div>
  );
};

// ==================== 🆕 MANAGE MATIÈRES (Ajout + Édition + Suppression) ====================
const ManageMatieres = ({ enseignant, onClose, onSaved, onNotify }) => {
  const [matieres, setMatieres] = useState(
    enseignant?.matieres?.length > 0
      ? [...enseignant.matieres]
      : enseignant?.matiere
      ? [enseignant.matiere]
      : []
  );
  const [nouvelle, setNouvelle] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // État pour l'édition inline
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("options_matieres");
      if (stored) setSuggestions(JSON.parse(stored));
    } catch {}
  }, []);

  // Focus auto sur l'input d'édition
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  // === AJOUTER ===
  const ajouter = () => {
    const m = nouvelle.trim();
    if (!m) return;
    if (matieres.some((x) => x.toLowerCase() === m.toLowerCase())) {
      onNotify("warning", `"${m}" existe déjà`);
      return;
    }
    setMatieres([...matieres, m]);
    setNouvelle("");
  };

  // === SUPPRIMER ===
  const supprimer = (index) => {
    setMatieres(matieres.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  // === COMMENCER L'ÉDITION ===
  const commencerEdition = (index) => {
    setEditingIndex(index);
    setEditingValue(matieres[index]);
  };

  // === VALIDER L'ÉDITION ===
  const validerEdition = () => {
    const v = editingValue.trim();
    if (!v) {
      setEditingIndex(null);
      setEditingValue("");
      return;
    }
    // Vérif doublon (sauf soi-même)
    const doublon = matieres.some(
      (x, i) => i !== editingIndex && x.toLowerCase() === v.toLowerCase()
    );
    if (doublon) {
      onNotify("warning", `"${v}" existe déjà`);
      return;
    }
    const newMatieres = [...matieres];
    newMatieres[editingIndex] = v;
    setMatieres(newMatieres);
    setEditingIndex(null);
    setEditingValue("");
  };

  // === ANNULER L'ÉDITION ===
  const annulerEdition = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  // === ENREGISTRER TOUT ===
  const enregistrer = async () => {
    // Si une édition est en cours, la valider d'abord
    if (editingIndex !== null && editingValue.trim()) {
      validerEdition();
    }

    if (matieres.length === 0) {
      onNotify("error", "Ajoutez au moins une matière");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("matieres", JSON.stringify(matieres));
      fd.append("matiere", matieres[0] || "");

      await api.put(`/api/allroute/enseignant/${enseignant._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Sauvegarder les suggestions
      try {
        const stored = localStorage.getItem("options_matieres");
        const sugg = stored ? JSON.parse(stored) : [];
        const newSugg = Array.from(new Set([...sugg, ...matieres]));
        localStorage.setItem("options_matieres", JSON.stringify(newSugg));
      } catch {}

      onNotify(
        "success",
        `Matières de ${enseignant.nomComplet} mises à jour ✅`
      );
      onSaved();
      onClose();
    } catch (error) {
      onNotify("error", error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !matieres.some((m) => m.toLowerCase() === s.toLowerCase()) &&
      (nouvelle === "" || s.toLowerCase().includes(nouvelle.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Gérer les matières</h3>
              <p className="text-xs opacity-90 truncate max-w-[180px]">
                {enseignant?.nomComplet}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* LISTE DES MATIÈRES ACTUELLES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600">
                Matières actuelles
                <span className="ml-1.5 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {matieres.length}
                </span>
              </p>
              {matieres.length > 0 && (
                <p className="text-[10px] text-gray-400 italic">
                  Cliquez pour modifier
                </p>
              )}
            </div>

            {matieres.length === 0 ? (
              <div className="p-4 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <BookOpen size={24} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Aucune matière</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Ajoutez-en au moins une
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {matieres.map((m, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 transition ${
                      editingIndex === index
                        ? "bg-blue-50 border-blue-300"
                        : "bg-amber-50 border-amber-200 hover:border-amber-400"
                    }`}
                  >
                    {editingIndex === index ? (
                      /* === MODE ÉDITION === */
                      <>
                        <BookOpen size={14} className="text-blue-500 flex-shrink-0" />
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              validerEdition();
                            }
                            if (e.key === "Escape") {
                              annulerEdition();
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={validerEdition}
                          className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          title="Valider"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={annulerEdition}
                          className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition"
                          title="Annuler"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      /* === MODE AFFICHAGE === */
                      <>
                        <button
                          type="button"
                          onClick={() => commencerEdition(index)}
                          className="flex-1 flex items-center gap-2 text-left hover:text-amber-700 transition group"
                          title="Cliquer pour modifier"
                        >
                          <BookOpen size={14} className="text-amber-600 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            {m}
                          </span>
                          <Pencil
                            size={11}
                            className="text-gray-400 opacity-0 group-hover:opacity-100 transition"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => supprimer(index)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AJOUTER UNE NOUVELLE MATIÈRE */}
          <div className="border-t pt-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              ➕ Ajouter une nouvelle matière
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Plus
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={nouvelle}
                  onChange={(e) => setNouvelle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ajouter();
                    }
                  }}
                  placeholder="Ex: Mathématiques..."
                  className="w-full pl-9 pr-3 py-2 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={ajouter}
                disabled={!nouvelle.trim()}
                className="px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {/* Suggestions rapides */}
            {filteredSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {filteredSuggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNouvelle(s)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-amber-100 text-gray-700 text-[10px] rounded-full transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-gray-50 border-t flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-3 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 text-sm transition"
          >
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={saving || matieres.length === 0}
            className="flex-1 px-3 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save size={14} /> Enregistrer ({matieres.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL VOIR / MODIFIER ENSEIGNANT ====================
const EnseignantModal = ({ enseignant, mode, onClose, onSave, onNotify }) => {
  const [formData, setFormData] = useState({
    matricule: enseignant?.matricule || "",
    nom: enseignant?.nom || "",
    prenom: enseignant?.prenom || "",
    genre: enseignant?.genre || "",
    adresse: enseignant?.adresse || enseignant?.contacts?.adresse || "",
    telephone: enseignant?.telephone || enseignant?.contacts?.telephone || "",
    matieres:
      enseignant?.matieres && Array.isArray(enseignant.matieres) && enseignant.matieres.length > 0
        ? [...enseignant.matieres]
        : enseignant?.matiere
        ? [enseignant.matiere]
        : [],
    heures: enseignant?.heures || "",
    email: enseignant?.email || enseignant?.contacts?.email || "",
    dateAjout: enseignant?.dateAjout?.slice(0, 10) || "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom?.trim() || !formData.prenom?.trim()) {
      onNotify("error", "Le nom et le prénom sont obligatoires");
      return;
    }
    if (!formData.matieres || formData.matieres.length === 0) {
      onNotify("error", "Ajoutez au moins une matière");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("matricule", formData.matricule?.trim() || "");
      fd.append("nom", formData.nom.trim());
      fd.append("prenom", formData.prenom.trim());
      fd.append("genre", formData.genre || "");
      fd.append("adresse", formData.adresse || "");
      fd.append("telephone", formData.telephone || "");
      fd.append("matieres", JSON.stringify(formData.matieres));
      fd.append("matiere", formData.matieres[0] || "");
      fd.append("heures", formData.heures || "");
      fd.append("email", formData.email || "");
      fd.append("dateAjout", formData.dateAjout || "");

      if (cvFile) {
        fd.append("cv", cvFile);
      }

      await api.put(`/api/allroute/enseignant/${enseignant._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onNotify("success", "Enseignant modifié avec succès ✨");
      onSave();
    } catch (err) {
      onNotify("error", err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const readOnly = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${
            readOnly ? "from-blue-600 to-indigo-700" : "from-emerald-600 to-green-700"
          } p-6 flex items-center justify-between`}
        >
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-2xl">
              {readOnly ? <Eye size={22} /> : <Edit size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {readOnly ? "Détails de l'enseignant" : "Modifier l'enseignant"}
              </h2>
              <p className="text-xs opacity-90 font-mono">{enseignant?.matricule}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            {enseignant?.photo ? (
              <img
                src={`http://localhost:4999${enseignant.photo}`}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {enseignant?.prenom?.[0]}
                {enseignant?.nom?.[0]}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{enseignant?.nomComplet}</h3>
              <p className="text-sm text-gray-500">
                {enseignant?.genre}
                {formData.matieres?.length > 0 && ` · ${formData.matieres.join(", ")}`}
              </p>
            </div>
          </div>

          {/* IDENTITÉ */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-blue-500" /> Identité
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Matricule" value={formData.matricule} readOnly={readOnly} placeholder="Auto si vide" onChange={(v) => handleChange("matricule", v)} />
              <Field label="Nom *" value={formData.nom} readOnly={readOnly} placeholder="Diallo" onChange={(v) => handleChange("nom", v)} />
              <Field label="Prénom *" value={formData.prenom} readOnly={readOnly} placeholder="Ousmane" onChange={(v) => handleChange("prenom", v)} />
              <Field label="Genre" value={formData.genre} readOnly={readOnly} placeholder="Homme / Femme" onChange={(v) => handleChange("genre", v)} />
              <div className="md:col-span-2">
                <Field label="Adresse" value={formData.adresse} readOnly={readOnly} placeholder="Conakry, Guinée" onChange={(v) => handleChange("adresse", v)} />
              </div>
            </div>
          </div>

          {/* COORDONNÉES */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Phone size={18} className="text-emerald-500" /> Coordonnées
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Téléphone" value={formData.telephone} readOnly={readOnly} placeholder="+224 600 00 00 00" onChange={(v) => handleChange("telephone", v)} />
              <Field label="Email" value={formData.email} readOnly={readOnly} type="email" placeholder="enseignant@gmail.com" onChange={(v) => handleChange("email", v)} />
            </div>
          </div>

          {/* INFORMATIONS PROFESSIONNELLES */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen size={18} className="text-amber-500" /> Informations professionnelles
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiMatieresEditable
                matieres={formData.matieres || []}
                onChange={(matieres) => {
                  setFormData((prev) => ({ ...prev, matieres }));
                }}
                readOnly={readOnly}
              />
              <Field label="Heures" value={formData.heures} readOnly={readOnly} placeholder="Ex: 20h/semaine" onChange={(v) => handleChange("heures", v)} />
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
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CV</label>
                {readOnly ? (
                  enseignant?.cv ? (
                    <a href={`http://localhost:4999${enseignant.cv}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 font-semibold hover:bg-purple-100 transition">
                      <FileText size={16} /> Voir le CV
                    </a>
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400">Aucun CV</div>
                  )
                ) : (
                  <>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 file:font-semibold hover:file:bg-purple-200 file:cursor-pointer" />
                    {cvFile && <p className="text-xs text-green-600 mt-1">✅ {cvFile.name}</p>}
                  </>
                )}
              </div>
              <Field label="Date d'ajout" value={formData.dateAjout} readOnly={readOnly} type="date" onChange={(v) => handleChange("dateAjout", v)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition">
            {readOnly ? "Fermer" : "Annuler"}
          </button>
          {!readOnly && (
            <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg flex items-center gap-2 disabled:opacity-50 transition">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL CONFIRMATION SUPPRESSION ====================
const ConfirmDelete = ({ enseignant, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={40} className="text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
        <p className="text-gray-600 text-sm">
          Voulez-vous vraiment supprimer <span className="font-semibold text-gray-800">{enseignant?.nomComplet}</span> ?
          <br />Cette action est irréversible.
        </p>
      </div>
      <div className="p-4 bg-gray-50 border-t flex gap-3">
        <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition">
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {loading ? "Suppression..." : "Supprimer"}
        </button>
      </div>
    </div>
  </div>
);

// ==================== COMPOSANT PRINCIPAL ====================
const ListeEnseignants = () => {
  const [formType, setFormType] = useState(null);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  const [selectedEnseignant, setSelectedEnseignant] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [manageTarget, setManageTarget] = useState(null);

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  const fetchEnseignants = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/allroute/enseignant/tous");
      const data = res.data.enseignants || res.data.data || [];
      setEnseignants(data);
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Impossible de charger les enseignants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnseignants();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/allroute/enseignant/${deleteTarget._id}`);
      showNotification("success", `${deleteTarget.nomComplet} a été supprimé(e) avec succès`);
      setDeleteTarget(null);
      fetchEnseignants();
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEnseignants = enseignants.filter((e) => {
    const t = searchTerm.toLowerCase();
    const matieresStr = Array.isArray(e.matieres) ? e.matieres.join(" ") : e.matiere || "";
    return (
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.email?.toLowerCase().includes(t) ||
      e.contacts?.email?.toLowerCase().includes(t) ||
      matieresStr.toLowerCase().includes(t)
    );
  });

  const renderListe = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <List size={22} className="text-blue-600" />
          Liste des enseignants
          <span className="ml-2 text-sm font-normal bg-white text-gray-600 px-3 py-1 rounded-full">
            {filteredEnseignants.length} enseignant(s)
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 w-64" />
          </div>
          <button onClick={fetchEnseignants} className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition" title="Rafraîchir">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-3" size={32} /> Chargement...
        </div>
      ) : filteredEnseignants.length === 0 ? (
        <div className="p-16 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun enseignant trouvé</h3>
          <p className="text-gray-500">Commencez par ajouter un enseignant.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Matricule</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Nom complet</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Téléphone</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Matière(s)</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Heures</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">CV</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnseignants.map((e) => {
                const matieresListe =
                  e.matieres && Array.isArray(e.matieres) && e.matieres.length > 0
                    ? e.matieres
                    : e.matiere
                    ? [e.matiere]
                    : [];

                return (
                  <tr key={e._id} className="border-b hover:bg-blue-50/40 transition">
                    <td className="p-4 font-mono text-sm font-semibold text-blue-700">{e.matricule}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {e.photo ? (
                          <img src={`http://localhost:4999${e.photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {e.prenom?.[0]}{e.nom?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                          <div className="text-xs text-gray-500">{e.genre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">{e.email || e.contacts?.email || "-"}</td>
                    <td className="p-4 text-sm text-gray-700">{e.telephone || e.contacts?.telephone || "-"}</td>

                    {/* COLONNE MULTI-MATIÈRES AVEC BOUTON GÉRER */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs items-center">
                        {matieresListe.length > 0 ? (
                          matieresListe.map((m) => (
                            <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                              <BookOpen size={10} />{m}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Aucune</span>
                        )}
                        <button
                          onClick={() => setManageTarget(e)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md hover:scale-110 transition-all"
                          title="Gérer les matières"
                        >
                          <Pencil size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-700">{e.heures || "-"}</td>
                    <td className="p-4">
                      {e.cv ? (
                        <a href={`http://localhost:4999${e.cv}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition">
                          <FileText size={12} /> Voir
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setSelectedEnseignant(e); setModalMode("view"); }} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Voir">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setSelectedEnseignant(e); setModalMode("edit"); }} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="Modifier">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(e)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification.show && (
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification((s) => ({ ...s, show: false }))} />
      )}

      {selectedEnseignant && modalMode && (
        <EnseignantModal
          enseignant={selectedEnseignant}
          mode={modalMode}
          onClose={() => { setSelectedEnseignant(null); setModalMode(null); }}
          onSave={() => { setSelectedEnseignant(null); setModalMode(null); fetchEnseignants(); }}
          onNotify={showNotification}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete enseignant={deleteTarget} loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}

      {/* ✅ MODAL GÉRER LES MATIÈRES (ajout + édition + suppression) */}
      {manageTarget && (
        <ManageMatieres
          enseignant={manageTarget}
          onClose={() => setManageTarget(null)}
          onSaved={fetchEnseignants}
          onNotify={showNotification}
        />
      )}

      {/* 2 BOUTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={() => setFormType("ajout")} className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${formType === "ajout" ? "bg-gradient-to-r from-blue-700 to-blue-900 scale-105" : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"}`}>
          <div className="p-3 bg-white/20 rounded-xl"><UserPlus size={24} /></div>
          <div className="text-left">
            <div className="text-lg">Ajouter</div>
            <div className="text-xs font-normal opacity-90">Nouvel enseignant</div>
          </div>
        </button>
        <button onClick={() => { setFormType(null); fetchEnseignants(); }} className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${formType === null ? "bg-gradient-to-r from-amber-700 to-amber-900 scale-105" : "bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"}`}>
          <div className="p-3 bg-white/20 rounded-xl"><List size={24} /></div>
          <div className="text-left">
            <div className="text-lg">Liste</div>
            <div className="text-xs font-normal opacity-90">Tous les enseignants</div>
          </div>
        </button>
      </div>

      {formType === "ajout" && (
        <div className="mb-8">
          <AddEnseignants onSuccess={() => { setFormType(null); fetchEnseignants(); }} onCancel={() => setFormType(null)} />
        </div>
      )}

      <div className="mt-8">{renderListe()}</div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default ListeEnseignants;