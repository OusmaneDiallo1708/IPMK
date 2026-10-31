// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Search, CheckCircle, XCircle, X, RefreshCw, UserPlus,
  BookOpen, Calendar, Hash, CreditCard, Plus, ChevronDown,
  RotateCw, Info
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
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
    </div>
  );
};

// ==================================================
// ============ DYNAMIC SELECT ======================
// ==================================================
const DynamicSelect = ({
  label,
  icon,
  storageKey,
  value,
  onChange,
  placeholder = "Sélectionner...",
  required = false,
  inputType = "text",
  allowAdd = true,
}) => {
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  const ref = useRef(null);

  // --- Charger depuis localStorage ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setOptions(JSON.parse(stored));
    } catch {
      setOptions([]);
    }
  }, [storageKey]);

  // --- Sauvegarder ---
  const saveOptions = (newOpts) => {
    setOptions(newOpts);
    localStorage.setItem(storageKey, JSON.stringify(newOpts));
  };

  // --- Ajouter ---
  const handleAdd = () => {
    const v = newOption.trim();
    if (!v) return;
    if (options.includes(v)) {
      setNewOption("");
      setAdding(false);
      onChange(v);
      setIsOpen(false);
      return;
    }
    const newOpts = [...options, v];
    saveOptions(newOpts);
    onChange(v);
    setNewOption("");
    setAdding(false);
    setIsOpen(false);
  };

  // --- Supprimer ---
  const handleDelete = (opt, e) => {
    e.stopPropagation();
    const newOpts = options.filter((o) => o !== opt);
    saveOptions(newOpts);
    if (value === opt) onChange("");
  };

  // --- Fermer au clic extérieur ---
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex-1 p-3 border border-gray-300 rounded-xl bg-white text-left flex items-center justify-between hover:border-purple-400 focus:ring-2 focus:ring-purple-500 outline-none transition"
        >
          <span className={value ? "text-gray-800" : "text-gray-400 truncate"}>
            {value || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {allowAdd && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setIsOpen(true);
            }}
            className="px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition flex items-center"
            title="Ajouter une option"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {allowAdd && adding && (
            <div className="p-2 border-b border-gray-100 flex gap-2 sticky top-0 bg-white">
              <input
                autoFocus
                type={inputType}
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewOption("");
                  }
                }}
                placeholder="Nouvelle option..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold"
              >
                OK
              </button>
            </div>
          )}

          {options.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Aucune option disponible.
            </div>
          ) : (
            options.map((opt) => (
              <div
                key={opt}
                className={`flex items-center justify-between px-3 py-2 hover:bg-purple-50 cursor-pointer group transition ${
                  value === opt ? "bg-purple-100" : ""
                }`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                <span className="text-sm text-gray-700 truncate">{opt}</span>
                {allowAdd && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(opt, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition shrink-0"
                    title="Supprimer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================== ÉTAT INITIAL ====================
const initialReinscription = {
  classe: "",
  niveau: "",
  option: "",
  anneeScolaire: "",
  fraisInscription: "",
  dateInscription: new Date().toLocaleDateString("fr-CA"),
};

// ==================================================
// ============ COMPOSANT REINSCRIPTION =============
// ==================================================
const Reinscription = ({ onSuccess, onCancel }) => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialReinscription);
  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  // ============ GÉNÉRER PROCHAINE ANNÉE ============
  const getNextYear = (currentYear) => {
    if (!currentYear) {
      const y = new Date().getFullYear();
      return `${y}-${y + 1}`;
    }
    const match = currentYear.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      const start = parseInt(match[1]) + 1;
      const end = parseInt(match[2]) + 1;
      return `${start}-${end}`;
    }
    return currentYear;
  };

  // ============ AUTO-REMPLISSAGE QUAND ÉTUDIANT SÉLECTIONNÉ ============
  const handleSelectStudent = (e) => {
    setSelected(e);

    setForm({
      classe: e.derniereClasse || "",
      niveau: e.dernierNiveau || "",
      option: e.derniereOption || "",
      anneeScolaire: getNextYear(e.anneeInscriptionActuelle),
      fraisInscription: e.dernierFraisInscription || e.fraisInscription || "",
      dateInscription: new Date().toLocaleDateString("fr-CA"),
    });
  };

  // Charger les étudiants DÉJÀ INSCRITS
  const fetchEtudiants = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/allroute/etudiant/tous");
      const data = res.data.etudiants || res.data.data || [];
      setEtudiants(data.filter((e) => e.inscrit));
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.message || "Impossible de charger les étudiants"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtudiants();
  }, []);

  const filtered = etudiants.filter((e) => {
    const t = searchTerm.toLowerCase();
    return (
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.contacts?.email?.toLowerCase().includes(t)
    );
  });

  // ==================== SOUMISSION ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      showNotification("error", "Veuillez sélectionner un étudiant");
      return;
    }
    if (!form.classe || !form.anneeScolaire) {
      showNotification("error", "Classe et année scolaire sont obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ MÊME ROUTE QUE INSCRIPTION
      const res = await api.post("/api/allroute/etudiant/inscription", {
        etudiantId: selected._id,
        ...form,
      });

      // ✅ Message enrichi : mentionne le paiement auto-créé
      const montant = Number(form.fraisInscription) || 0;
      const paiementInfo = res.data?.paiement
        ? ` — Paiement de ${new Intl.NumberFormat("fr-FR").format(montant)} GNF enregistré en comptabilité ✅`
        : (montant > 0 ? " — Frais de réinscription transmis à la comptabilité" : "");

      showNotification("success", `${selected.nomComplet} réinscrit(e) avec succès !${paiementInfo}`);
      setSelected(null);
      setForm(initialReinscription);
      fetchEtudiants();
      onSuccess?.();
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.message || "Erreur lors de la réinscription"
      );
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

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCw size={24} className="text-purple-600" />
            Réinscrire un étudiant
          </h2>
        </div>

        {/* ===== SÉLECTION ÉTUDIANT ===== */}
        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Search size={18} className="text-purple-500" /> 1. Choisir un étudiant déjà inscrit
          </h3>

          {!selected ? (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matricule ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Chargement...
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-center text-gray-500 text-sm">
                  Aucun étudiant inscrit trouvé.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filtered.map((e) => (
                    <button
                      key={e._id}
                      type="button"
                      onClick={() => handleSelectStudent(e)}
                      className="flex items-center gap-3 w-full p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition text-left"
                    >
                      {e.photo ? (
                        <img
                          src={`http://localhost:4999${e.photo}`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {e.prenom?.[0]}
                          {e.nom?.[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                        <div className="text-xs text-gray-500">
                          {e.matricule} · {e.contacts?.email}
                        </div>
                        {e.derniereClasse && (
                          <div className="text-xs text-purple-500 font-medium mt-0.5">
                            Dernière classe : {e.derniereClasse}
                          </div>
                        )}
                      </div>
                      {e.anneeInscriptionActuelle && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                          {e.anneeInscriptionActuelle}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-300">
              {selected.photo ? (
                <img
                  src={`http://localhost:4999${selected.photo}`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                  {selected.prenom?.[0]}
                  {selected.nom?.[0]}
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{selected.nomComplet}</div>
                <div className="text-xs text-gray-500">
                  {selected.matricule}
                  {selected.derniereClasse && ` · Dernière classe : ${selected.derniereClasse}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setForm(initialReinscription);
                }}
                className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ===== INFOS RÉINSCRIPTION ===== */}
        {selected && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen size={18} className="text-purple-500" /> 2. Vérifiez et modifiez si nécessaire
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nouvelle classe */}
              <DynamicSelect
                label="Nouvelle classe"
                icon={<Hash size={14} className="text-gray-400" />}
                storageKey="options_classe"
                value={form.classe}
                onChange={(v) => setForm((f) => ({ ...f, classe: v }))}
                placeholder="Ex: 11ème année"
                required
                allowAdd={true}
              />

              {/* Niveau */}
              <DynamicSelect
                label="Niveau"
                icon={<Hash size={14} className="text-gray-400" />}
                storageKey="options_niveau"
                value={form.niveau}
                onChange={(v) => setForm((f) => ({ ...f, niveau: v }))}
                placeholder="Ex: C.A.P/BEP"
                allowAdd={true}
              />

              {/* Options */}
              <DynamicSelect
                label="Options"
                icon={<BookOpen size={14} className="text-gray-400" />}
                storageKey="options_option"
                value={form.option}
                onChange={(v) => setForm((f) => ({ ...f, option: v }))}
                placeholder="Ex: Comptabilite Gestion"
                allowAdd={true}
              />

              {/* Nouvelle année scolaire */}
              <DynamicSelect
                label="Nouvelle année scolaire"
                icon={<Calendar size={14} className="text-gray-400" />}
                storageKey="options_anneeScolaire"
                value={form.anneeScolaire}
                onChange={(v) => setForm((f) => ({ ...f, anneeScolaire: v }))}
                placeholder="Ex: 2027-2028"
                required
                allowAdd={true}
              />

              {/* Frais de réinscription */}
              <DynamicSelect
                label="Frais de réinscription & (Carte d'étudiant et T-shirt)"
                icon={<CreditCard size={14} className="text-gray-400" />}
                storageKey="options_fraisInscription"
                value={form.fraisInscription}
                onChange={(v) => setForm((f) => ({ ...f, fraisInscription: v }))}
                placeholder="Ex: 150000"
                inputType="number"
                allowAdd={true}
              />

              {/* Date d'inscription */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" /> Date de réinscription
                </label>
                <input
                  type="date"
                  value={form.dateInscription}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateInscription: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* ✅ BANNIÈRE INFO : paiement auto-synchronisé */}
            {Number(form.fraisInscription) > 0 && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-2">
                <Info size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-emerald-800">
                    💰 Synchronisation automatique avec la comptabilité
                  </p>
                  <p className="text-emerald-700 text-xs mt-1">
                    Un paiement de type <strong>« Inscription »</strong> de{" "}
                    <strong>
                      {new Intl.NumberFormat("fr-FR").format(Number(form.fraisInscription))} GNF
                    </strong>{" "}
                    sera créé automatiquement dans la caisse de la comptabilité. Un reçu PDF sera disponible.
                  </p>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setForm(initialReinscription);
                  onCancel?.();
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Réinscription...
                  </>
                ) : (
                  <>
                    <RotateCw size={18} /> Valider la réinscription
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

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

export default Reinscription;