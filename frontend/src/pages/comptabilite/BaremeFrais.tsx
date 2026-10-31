// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  X, RefreshCw, CheckCircle, XCircle, Info, Save,
  Percent, Trash2, Plus, Edit, BookOpen, Calendar,
  GraduationCap, AlertCircle
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
    info:    { bg: "from-blue-500 to-indigo-600",    icon: <Info size={20} /> },
  }[type] || { bg: "from-red-500 to-rose-600", icon: <XCircle size={20} /> };

  return (
    <div className="fixed top-6 right-6 z-[120] animate-slide-in-right">
      <div className={`bg-gradient-to-r ${config.bg} text-white rounded-2xl shadow-2xl max-w-md flex items-start p-4 gap-3`}>
        <div className="bg-white/20 rounded-xl p-2">{config.icon}</div>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
    </div>
  );
};

// ==================== FORMAT GNF (arrondi) ====================
const formatGNF = (montant) => {
  if (!montant && montant !== 0) return "0 GNF";
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)) + " GNF";
};

// ==================== NORMALISATION (pour éviter les doublons) ====================
const normaliserClasse = (c) => {
  if (!c) return "";
  return c.toString().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
};

// ==================== COMPOSANT PRINCIPAL ====================
const BaremeFrais = ({ onClose, onNotify }) => {
  const [baremes, setBaremes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBareme, setEditingBareme] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  // ✅ ÉTATS POUR LES CLASSES (provenant des inscriptions)
  const [classesDisponibles, setClassesDisponibles] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [modeNouvelleClasse, setModeNouvelleClasse] = useState(false);

  const [formData, setFormData] = useState({
    classe: "",
    anneeScolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    fraisInscription: "",
    fraisScolarite: "",
    fraisTenue: "",
    description: "",
  });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    onNotify?.(type, message);
  };

  // ==================== CHARGER LES BARÈMES ====================
  const fetchBaremes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/allroute/comptabilite/baremes");
      setBaremes(res.data.baremes || []);
    } catch (error) {
      showNotification("error", "Impossible de charger les barèmes");
    } finally {
      setLoading(false);
    }
  };

  // ==================== ✅ CHARGER LES CLASSES DISPONIBLES ====================
  const fetchClassesDisponibles = async () => {
    setLoadingClasses(true);
    try {
      let classes = [];

      // 1️⃣ Tentative : endpoint dédié (si existe)
      try {
        const res = await api.get("/api/allroute/comptabilite/classes");
        classes = res.data.classes || [];
      } catch {
        // 2️⃣ Fallback : extraire depuis les étudiants (inscriptions)
        const res = await api.get("/api/allroute/etudiant/tous");
        const etudiants = res.data.etudiants || res.data.data || [];

        const map = new Map();
        etudiants.forEach((e) => {
          [e.classe, e.derniereClasse].forEach((c) => {
            if (c && c.trim()) {
              const key = normaliserClasse(c);
              if (!map.has(key)) {
                map.set(key, c.trim()); // garde la première orthographe rencontrée
              }
            }
          });
        });

        classes = Array.from(map.values()).sort((a, b) =>
          a.localeCompare(b, "fr", { sensitivity: "base" })
        );
      }

      setClassesDisponibles(classes);
    } catch (error) {
      console.error("Erreur chargement classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchBaremes();
    fetchClassesDisponibles();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ==================== SOUMISSION ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classe || !formData.classe.trim() || !formData.anneeScolaire) {
      showNotification("error", "Classe et année scolaire obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Nettoie le nom de la classe avant envoi
      const payload = {
        ...formData,
        classe: formData.classe.trim(),
        fraisInscription: Number(formData.fraisInscription) || 0,
        fraisScolarite: Number(formData.fraisScolarite) || 0,
        fraisTenue: Number(formData.fraisTenue) || 0,
      };

      await api.post("/api/allroute/comptabilite/baremes", payload);
      showNotification("success", "Barème enregistré avec succès !");
      setFormData({
        classe: "",
        anneeScolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        fraisInscription: "",
        fraisScolarite: "",
        fraisTenue: "",
        description: "",
      });
      setShowForm(false);
      setEditingBareme(null);
      setModeNouvelleClasse(false);
      fetchBaremes();
      fetchClassesDisponibles(); // ✅ Recharge les classes
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== MODIFIER ====================
  const handleEdit = (b) => {
    setFormData({
      classe: b.classe,
      anneeScolaire: b.anneeScolaire,
      fraisInscription: b.fraisInscription || "",
      fraisScolarite: b.fraisScolarite || "",
      fraisTenue: b.fraisTenue || "",
      description: b.description || "",
    });
    setEditingBareme(b);
    setShowForm(true);
    // Si la classe n'existe pas dans la liste → mode manuel
    const existe = classesDisponibles.some(
      (c) => normaliserClasse(c) === normaliserClasse(b.classe)
    );
    setModeNouvelleClasse(!existe);
  };

  // ==================== SUPPRIMER ====================
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/allroute/comptabilite/baremes/${deleteTarget._id}`);
      showNotification("success", "Barème supprimé");
      setDeleteTarget(null);
      fetchBaremes();
    } catch (error) {
      showNotification("error", "Erreur suppression");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      classe: "",
      anneeScolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      fraisInscription: "",
      fraisScolarite: "",
      fraisTenue: "",
      description: "",
    });
    setEditingBareme(null);
    setShowForm(false);
    setModeNouvelleClasse(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      {/* MODAL SUPPRESSION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Supprimer ce barème ?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Classe <strong>{deleteTarget.classe}</strong> · {deleteTarget.anneeScolaire}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100">
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2">
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Percent size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Barème des frais</h2>
              <p className="text-sm opacity-90">Configurez les frais par classe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* BOUTON AJOUTER */}
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingBareme(null);
                setModeNouvelleClasse(false);
              }}
              className="w-full mb-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Ajouter un barème
            </button>
          )}

          {/* FORMULAIRE */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-2xl p-5 border-2 border-purple-200 space-y-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                {editingBareme ? <Edit size={18} /> : <Plus size={18} />}
                {editingBareme ? "Modifier le barème" : "Nouveau barème"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ==================== ✅ CLASSE : SELECT + AJOUT MANUEL ==================== */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Classe <span className="text-red-500">*</span>
                  </label>

                  {!modeNouvelleClasse ? (
                    <div className="relative">
                      <GraduationCap
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"
                      />
                      <select
                        value={
                          classesDisponibles.some(
                            (c) => normaliserClasse(c) === normaliserClasse(formData.classe)
                          )
                            ? formData.classe
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setModeNouvelleClasse(true);
                            handleChange("classe", "");
                          } else {
                            handleChange("classe", e.target.value);
                          }
                        }}
                        required={!modeNouvelleClasse}
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer bg-white appearance-none"
                      >
                        <option value="">-- Sélectionner une classe existante --</option>
                        {classesDisponibles.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        {/* <option value="__NEW__" className="font-bold text-purple-700">
                          ➕ Nouvelle classe (saisir manuellement)
                        </option> */}
                      </select>
                      <ChevronIcon />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <GraduationCap
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          value={formData.classe}
                          onChange={(e) => handleChange("classe", e.target.value)}
                          placeholder="Ex: 10ème année, L2..."
                          required
                          autoFocus
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModeNouvelleClasse(false);
                          handleChange("classe", "");
                        }}
                        className="px-4 py-2.5 bg-white text-gray-700 rounded-xl font-semibold border border-gray-300 hover:bg-gray-100 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  )}

                  {loadingClasses && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Chargement des classes...
                    </p>
                  )}
                  {!loadingClasses && classesDisponibles.length > 0 && !modeNouvelleClasse && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {classesDisponibles.length} classe(s) existante(s) détectée(s) depuis les inscriptions
                    </p>
                  )}
                  {!loadingClasses && classesDisponibles.length === 0 && !modeNouvelleClasse && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Aucune classe existante trouvée. Utilisez "➕ Nouvelle classe".
                    </p>
                  )}
                </div>

                {/* Année scolaire */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Année scolaire <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.anneeScolaire}
                    onChange={(e) => handleChange("anneeScolaire", e.target.value)}
                    placeholder="Ex: 2025-2026"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Frais inscription */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Frais d'inscription (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.fraisInscription}
                    onChange={(e) => handleChange("fraisInscription", e.target.value)}
                    placeholder="Ex: 100000"
                    min="0"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div> */}

                {/* Frais scolarité */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Frais de scolarité annuels (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.fraisScolarite}
                    onChange={(e) => handleChange("fraisScolarite", e.target.value)}
                    placeholder="Ex: 1500000"
                    min="0"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Frais tenue */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Frais tenue / carte (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.fraisTenue}
                    onChange={(e) => handleChange("fraisTenue", e.target.value)}
                    placeholder="Ex: 50000"
                    min="0"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div> */}

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Note optionnelle"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* TOTAL */}
              {formData.fraisInscription || formData.fraisScolarite || formData.fraisTenue ? (
                <div className="bg-purple-100 rounded-xl p-4 border border-purple-300">
                  <p className="text-sm text-purple-700 font-semibold">TOTAL ANNUEL :</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatGNF(
                      (Number(formData.fraisInscription) || 0) +
                      (Number(formData.fraisScolarite) || 0) +
                      (Number(formData.fraisTenue) || 0)
                    )}
                  </p>
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {submitting ? "Enregistrement..." : editingBareme ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </form>
          )}

          {/* LISTE DES BARÈMES */}
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
              Chargement...
            </div>
          ) : baremes.length === 0 ? (
            <div className="p-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun barème configuré</h3>
              <p className="text-gray-500">Cliquez sur "Ajouter un barème" pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {baremes.map((b) => {
                const total = (b.fraisInscription || 0) + (b.fraisScolarite || 0) + (b.fraisTenue || 0);
                return (
                  <div key={b._id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <BookOpen className="text-purple-600" size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 text-lg">{b.classe}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                              {b.anneeScolaire}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                            <span>📝 Inscription : {formatGNF(b.fraisInscription)}</span>
                            <span>📚 Scolarité : {formatGNF(b.fraisScolarite)}</span>
                            <span>👕 Tenue : {formatGNF(b.fraisTenue)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-semibold">TOTAL</p>
                          <p className="text-xl font-bold text-purple-600">{formatGNF(total)}</p>
                        </div>
                        <button onClick={() => handleEdit(b)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(b)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
      `}</style>
    </div>
  );
};

// Petit composant chevron pour le select custom
const ChevronIcon = () => (
  <svg
    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default BaremeFrais;