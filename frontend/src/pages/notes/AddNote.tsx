// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Save, X, RefreshCw, CheckCircle, XCircle,
  Search, User, BookOpen, Hash, Calendar,
  Award, Percent, FileText, AlertCircle, Info,
  Plus, ChevronDown, GraduationCap, AlertTriangle, RotateCcw,
  Trash2, Layers
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
    warning: { bg: "from-amber-500 to-orange-600",   icon: <AlertTriangle size={20} /> },
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

// ==================== DYNAMIC SELECT ====================
const DynamicSelect = ({
  label, icon, storageKey, value, onChange,
  placeholder = "Sélectionner...", required = false, inputType = "text",
  allowAdd = true, externalOptions = null,
}) => {
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newOption, setNewOption] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (externalOptions !== null) {
      setOptions(externalOptions);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setOptions(JSON.parse(stored));
    } catch { setOptions([]); }
  }, [storageKey, externalOptions]);

  const saveOptions = (newOpts) => {
    setOptions(newOpts);
    if (externalOptions === null && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newOpts));
    }
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
      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
        {icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-left flex items-center justify-between hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
        >
          <span className={value ? "text-gray-800 truncate" : "text-gray-400 truncate"}>
            {value || placeholder}
          </span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {allowAdd && (
          <button
            type="button"
            onClick={() => { setAdding(true); setIsOpen(true); }}
            className="px-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold transition flex items-center"
            title="Ajouter une option"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {allowAdd && adding && (
            <div className="p-2 border-b border-gray-100 flex gap-1 sticky top-0 bg-white">
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
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button type="button" onClick={handleAdd} className="px-2 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold">OK</button>
            </div>
          )}

          {options.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-xs">Aucune matière</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-indigo-50 cursor-pointer group transition text-sm ${value === opt ? "bg-indigo-100" : ""}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                <span className="text-gray-700 truncate">{opt}</span>
                {allowAdd && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(opt, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition shrink-0"
                  >
                    <X size={12} />
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

// ==================== BLOC NOTE (ligne individuelle) ====================
const EMPTY_NOTE = {
  matiere: "",
  note: "",
  coefficient: 1,
  type: "Devoir",
  trimestre: 1,
  dateEvaluation: new Date().toLocaleDateString("fr-CA"),
  commentaire: "",
};

const NoteBlock = ({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
  matieresDisponibles,
  enseignantSelectionne,
  loadingEnseignants,
}) => {
  const handleField = (field, value) => {
    onChange(index, { ...data, [field]: value });
  };

  return (
    <div className="relative bg-white border-2 border-indigo-200 rounded-2xl p-4 hover:shadow-md transition">
      {/* Numéro + Supprimer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow">
            {index + 1}
          </div>
          <span className="text-xs font-bold text-gray-600 uppercase">
            Note {index + 1}
          </span>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
            title="Supprimer cette note"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Champs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Matière */}
        <div className="col-span-2">
          <DynamicSelect
            label="Matière"
            icon={<BookOpen size={12} className="text-gray-400" />}
            storageKey="options_matiere"
            value={data.matiere}
            onChange={(v) => handleField("matiere", v)}
            placeholder={
              loadingEnseignants ? "Chargement..."
              : matieresDisponibles.length === 0 ? "Aucun enseignant"
              : "Choisir..."
            }
            required
            allowAdd={false}
            externalOptions={matieresDisponibles}
          />
          {enseignantSelectionne && (
            <p className="text-[10px] text-indigo-600 mt-1 flex items-center gap-1">
              <GraduationCap size={10} />
              {enseignantSelectionne.prenom} {enseignantSelectionne.nom}
            </p>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <Award size={12} className="text-gray-400" /> Note /20 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.note}
            onChange={(e) => handleField("note", e.target.value)}
            placeholder="15.5"
            step="0.25"
            min="0"
            max="20"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          />
        </div>

        {/* Coefficient */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <Percent size={12} className="text-gray-400" /> Coef
          </label>
          <input
            type="number"
            value={data.coefficient}
            onChange={(e) => handleField("coefficient", e.target.value)}
            step="0.5"
            min="0.5"
            max="10"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
          <select
            value={data.type}
            onChange={(e) => handleField("type", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer text-sm"
          >
            <option value="Devoir">Devoir</option>
            <option value="Composition">Composition</option>
            <option value="Interrogation">Interrogation</option>
            <option value="Examen">Examen</option>
          </select>
        </div>

        {/* Trimestre */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Trim.</label>
          <select
            value={data.trimestre}
            onChange={(e) => handleField("trimestre", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer text-sm"
          >
            <option value={1}>1er</option>
            <option value={2}>2ème</option>
            <option value={3}>3ème</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <Calendar size={12} className="text-gray-400" /> Date
          </label>
          <input
            type="date"
            value={data.dateEvaluation}
            onChange={(e) => handleField("dateEvaluation", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          />
        </div>

        {/* Commentaire */}
        <div className="col-span-2 md:col-span-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <FileText size={12} className="text-gray-400" /> Commentaire (optionnel)
          </label>
          <input
            type="text"
            value={data.commentaire}
            onChange={(e) => handleField("commentaire", e.target.value)}
            placeholder="Ex: Bon travail..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const AddNote = ({ preselectedEtudiant = null, onSuccess, onCancel }) => {
  const [etudiants, setEtudiants] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEtudiant, setSelectedEtudiant] = useState(preselectedEtudiant);

  // ✅ TABLEAU DE NOTES
  const [notesList, setNotesList] = useState([{ ...EMPTY_NOTE }]);

  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  // Anti-doublon
  const [doublonsDetectes, setDoublonsDetectes] = useState([]);
  const [showConfirmDuplicate, setShowConfirmDuplicate] = useState(false);

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  // ==================== FETCH ====================
  const fetchEtudiants = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/allroute/etudiant/tous");
      const data = res.data.etudiants || res.data.data || [];
      setEtudiants(data);
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Impossible de charger les étudiants");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnseignants = async () => {
    setLoadingEnseignants(true);
    try {
      const res = await api.get("/api/allroute/enseignant/tous");
      const data = res.data.enseignants || res.data.data || [];
      setEnseignants(data);
    } catch (error) {
      console.warn("⚠️ Impossible de charger les enseignants:", error.message);
    } finally {
      setLoadingEnseignants(false);
    }
  };

  useEffect(() => {
    if (!preselectedEtudiant) fetchEtudiants();
    fetchEnseignants();
  }, [preselectedEtudiant]);

  const matieresDisponibles = React.useMemo(() => {
    const set = new Set();
    enseignants.forEach((e) => {
      if (e.matiere && e.matiere.trim()) set.add(e.matiere.trim());
      if (Array.isArray(e.matieres)) {
        e.matieres.forEach((m) => m && m.trim() && set.add(m.trim()));
      }
    });
    return Array.from(set).sort();
  }, [enseignants]);

  // Trouver l'enseignant pour une matière donnée
  const getEnseignantPourMatiere = (matiere) => {
    if (!matiere) return null;
    return enseignants.find((e) => {
      const list = e.matieres?.length ? e.matieres : (e.matiere ? [e.matiere] : []);
      return list.some((m) => m?.trim().toLowerCase() === matiere.trim().toLowerCase());
    }) || null;
  };

  const filteredEtudiants = etudiants.filter((e) => {
    const t = searchTerm.toLowerCase();
    return (
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.contacts?.email?.toLowerCase().includes(t) ||
      e.derniereClasse?.toLowerCase().includes(t)
    );
  });

  // ==================== HANDLERS NOTES ====================
  const handleNoteChange = (index, newData) => {
    setNotesList((prev) => {
      const copy = [...prev];
      copy[index] = newData;
      return copy;
    });
  };

  const addNoteBlock = () => {
    setNotesList((prev) => [...prev, { ...EMPTY_NOTE }]);
  };

  const removeNoteBlock = (index) => {
    setNotesList((prev) => prev.filter((_, i) => i !== index));
  };

  // ==================== VÉRIFIER DOUBLON ====================
  const verifierDoublon = async (payload) => {
    try {
      const res = await api.get("/api/allroute/notes/toutes", {
        params: {
          etudiant: payload.etudiant,
          matiere: payload.matiere,
          trimestre: payload.trimestre,
        },
      });
      const notes = res.data.notes || [];
      return notes.find(
        (n) =>
          n.type === payload.type &&
          n.matiere?.trim().toLowerCase() === payload.matiere.trim().toLowerCase()
      ) || null;
    } catch (error) {
      console.warn("Vérification doublon impossible:", error.message);
      return null;
    }
  };

  // ==================== VALIDATION ====================
  const valider = () => {
    if (!selectedEtudiant) {
      showNotification("error", "Veuillez sélectionner un étudiant");
      return null;
    }

    const payloads = [];
    for (let i = 0; i < notesList.length; i++) {
      const n = notesList[i];
      if (!n.matiere?.trim()) {
        showNotification("error", `Note ${i + 1} : La matière est obligatoire`);
        return null;
      }
      if (n.note === "" || n.note === null) {
        showNotification("error", `Note ${i + 1} : La note est obligatoire`);
        return null;
      }
      const noteNum = Number(n.note);
      if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
        showNotification("error", `Note ${i + 1} : La note doit être entre 0 et 20`);
        return null;
      }

      const enseignantMatch = getEnseignantPourMatiere(n.matiere);

      payloads.push({
        etudiant: selectedEtudiant._id,
        matiere: n.matiere.trim(),
        classe: selectedEtudiant.derniereClasse || selectedEtudiant.classe || "",
        niveau: selectedEtudiant.dernierNiveau || selectedEtudiant.niveau || "",
        option: selectedEtudiant.derniereOption || selectedEtudiant.option || "",
        anneeScolaire: selectedEtudiant.anneeInscriptionActuelle || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        note: noteNum,
        coefficient: Number(n.coefficient) || 1,
        type: n.type,
        trimestre: Number(n.trimestre),
        dateEvaluation: n.dateEvaluation,
        commentaire: n.commentaire || "",
        enseignant: enseignantMatch?._id || null,
      });
    }
    return payloads;
  };

  // ==================== SOUMISSION ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payloads = valider();
    if (!payloads) return;

    // ✅ VÉRIF DOUBLONS (si pas encore confirmé)
    if (!showConfirmDuplicate) {
      const doublons = [];
      for (let i = 0; i < payloads.length; i++) {
        const existing = await verifierDoublon(payloads[i]);
        if (existing) {
          doublons.push({ index: i, existing, nouveau: payloads[i] });
        }
      }
      if (doublons.length > 0) {
        setDoublonsDetectes(doublons);
        setShowConfirmDuplicate(true);
        showNotification(
          "warning",
          `${doublons.length} note(s) existent déjà. Confirmez pour remplacer.`
        );
        return;
      }
    }

    // ✅ ENREGISTREMENT
    setSubmitting(true);
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];
        try {
          const doublon = showConfirmDuplicate
            ? doublonsDetectes.find((d) => d.index === i)
            : null;

          if (doublon && doublon.existing) {
            await api.put(`/api/allroute/notes/${doublon.existing._id}`, payload);
            updateCount++;
          } else {
            await api.post("/api/allroute/notes/ajout", payload);
            successCount++;
          }
        } catch (err) {
          console.error(`Erreur note ${i + 1}:`, err);
          errorCount++;
        }
      }

      const messageParts = [];
      if (successCount > 0) messageParts.push(`${successCount} ajoutée(s)`);
      if (updateCount > 0) messageParts.push(`${updateCount} mise(s) à jour`);
      if (errorCount > 0) messageParts.push(`${errorCount} échouée(s)`);

      if (errorCount > 0) {
        showNotification("warning", `Résultat : ${messageParts.join(", ")}`);
      } else {
        showNotification("success", `✅ ${messageParts.join(", ")} avec succès !`);
      }

      setNotesList([{ ...EMPTY_NOTE }]);
      setDoublonsDetectes([]);
      setShowConfirmDuplicate(false);
      if (!preselectedEtudiant) setSelectedEtudiant(null);

      setTimeout(() => { onSuccess?.(); }, 1000);
    } catch (error) {
      console.error("❌ Erreur enregistrement:", error);
      showNotification("error", error?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const annulerDoublon = () => {
    setDoublonsDetectes([]);
    setShowConfirmDuplicate(false);
  };

  // ==================== RENDU ====================
  return (
    <>
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      {/* MODAL DOUBLON */}
      {showConfirmDuplicate && doublonsDetectes.length > 0 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in my-8">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {doublonsDetectes.length} doublon(s) détecté(s)
                </h3>
                <p className="text-xs opacity-90">
                  Voulez-vous remplacer les notes existantes ?
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
              {doublonsDetectes.map((d) => (
                <div key={d.index} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-800 mb-1">
                    Note {d.index + 1} — {d.nouveau.matiere}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Actuelle : </span>
                      <span className="font-bold">{d.existing.note}/20</span>
                      <span className="text-gray-500"> ({d.existing.type})</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Nouvelle : </span>
                      <span className="font-bold text-emerald-700">{d.nouveau.note}/20</span>
                      <span className="text-gray-500"> ({d.nouveau.type})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-2">
              <button
                onClick={annulerDoublon}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 text-sm transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 transition"
              >
                {submitting ? (
                  <><RefreshCw size={14} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><RotateCcw size={14} /> Remplacer tout</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Award size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Ajouter des notes
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
                {notesList.length} note{notesList.length > 1 ? "s" : ""}
              </span>
            </h2>
            <p className="text-indigo-100 text-sm">
              Sélectionnez un étudiant et ajoutez 1, 2, 3… notes
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* SÉLECTION ÉTUDIANT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-blue-500" /> 1. Choisir un étudiant
              </h3>
            </div>

            {!selectedEtudiant ? (
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, matricule ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {loading ? (
                  <div className="p-6 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Chargement...
                  </div>
                ) : filteredEtudiants.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 text-sm">Aucun étudiant trouvé.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {filteredEtudiants.map((e) => (
                      <button
                        key={e._id}
                        type="button"
                        onClick={() => setSelectedEtudiant(e)}
                        className="flex items-center gap-3 w-full p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition text-left"
                      >
                        {e.photo ? (
                          <img src={`http://localhost:4999${e.photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {e.prenom?.[0]}{e.nom?.[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                          <div className="text-xs text-gray-500">
                            {e.matricule} · {e.derniereClasse || e.classe || "-"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-300">
                {selectedEtudiant.photo ? (
                  <img src={`http://localhost:4999${selectedEtudiant.photo}`} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedEtudiant.prenom?.[0]}{selectedEtudiant.nom?.[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">{selectedEtudiant.nomComplet}</div>
                  <div className="text-xs text-gray-500 font-mono">{selectedEtudiant.matricule}</div>
                  <div className="text-xs text-indigo-600 font-medium mt-0.5">
                    📚 {selectedEtudiant.derniereClasse || selectedEtudiant.classe || "-"}
                  </div>
                </div>
                {!preselectedEtudiant && (
                  <button
                    type="button"
                    onClick={() => setSelectedEtudiant(null)}
                    className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 transition"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* LISTE DES NOTES */}
          {selectedEtudiant && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Layers size={18} className="text-amber-500" />
                    2. Notes à ajouter ({notesList.length})
                  </h3>
                </div>
              </div>

              {/* Blocs de notes */}
              <div className="space-y-3">
                {notesList.map((noteData, index) => (
                  <NoteBlock
                    key={index}
                    index={index}
                    data={noteData}
                    onChange={handleNoteChange}
                    onRemove={removeNoteBlock}
                    canRemove={notesList.length > 1}
                    matieresDisponibles={matieresDisponibles}
                    enseignantSelectionne={getEnseignantPourMatiere(noteData.matiere)}
                    loadingEnseignants={loadingEnseignants}
                  />
                ))}
              </div>

              {/* BOUTON AJOUTER UNE AUTRE NOTE */}
              <button
                type="button"
                onClick={addNoteBlock}
                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 font-semibold transition flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Ajouter une autre note
              </button>

              {matieresDisponibles.length === 0 && !loadingEnseignants && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>Aucune matière disponible</strong> — Ajoutez d'abord un enseignant avec sa matière.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOUTONS */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <button
            type="button"
            onClick={() => { onCancel?.(); }}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-100 transition-all"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info size={14} />
            {notesList.length} note{notesList.length > 1 ? "s" : ""} à enregistrer
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedEtudiant}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Enregistrement {notesList.length > 1 ? `${notesList.length} notes...` : "..."}
              </>
            ) : (
              <>
                <Save size={18} />
                Enregistrer {notesList.length > 1 ? `les ${notesList.length} notes` : "la note"}
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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </>
  );
};

export default AddNote;