// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, List, Search, X, CheckCircle, XCircle,
  Edit, Trash2, Eye, Award, RefreshCw, AlertCircle,
  ChevronDown, ChevronRight, BookOpen, User, Users,
  TrendingUp, TrendingDown, Filter, Calendar,
  FileText, Save, Info, Percent, Layers
} from "lucide-react";
import api from "../../config/axiosConfig";
import AddNote from "./AddNote";

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
    <div className="fixed top-6 right-6 z-[100] animate-slide-in-right">
      <div className={`bg-gradient-to-r ${config.bg} text-white rounded-2xl shadow-2xl max-w-md flex items-start p-4 gap-3 border border-white/20`}>
        <div className="bg-white/20 rounded-xl p-2">{config.icon}</div>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
    </div>
  );
};

// ==================== STAT CARD ====================
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-3 rounded-xl ${color.bg}`}>
        <span className={color.text}>{icon}</span>
      </div>
      <span className="text-xs text-gray-500 font-semibold uppercase">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${color.valueText || "text-gray-800"}`}>{value}</p>
  </div>
);

// ==================== MODAL SUPPRESSION ====================
const ConfirmDelete = ({ note, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={40} className="text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Supprimer cette note ?</h3>
        <p className="text-gray-600 text-sm">
          <strong>{note?.etudiant?.nomComplet}</strong> — <strong>{note?.matiere}</strong>
          <br />
          Note : <strong>{note?.note}/20</strong> ({note?.type} · T{note?.trimestre})
          <br />
          <span className="text-xs text-red-500 mt-2 inline-block">Cette action est irréversible</span>
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
const ListeNotes = () => {
  const [formType, setFormType] = useState(null); // null = liste, "ajout" = formulaire
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const [filterTrimestre, setFilterTrimestre] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  // États UI
  const [expandedStudents, setExpandedStudents] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [quickAddEtudiant, setQuickAddEtudiant] = useState(null);

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  // ==================== FETCH ====================
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/allroute/notes/toutes");
      setNotes(res.data.notes || []);
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Impossible de charger les notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  // ==================== HELPER MOYENNE ====================
  const calculerMoyenne = (notesList) => {
    if (!notesList || notesList.length === 0) return 0;
    let total = 0;
    let coef = 0;
    notesList.forEach((n) => {
      total += n.note * n.coefficient;
      coef += n.coefficient;
    });
    return coef > 0 ? total / coef : 0;
  };

  // ==================== FILTRES ====================
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const t = searchTerm.toLowerCase();
      const matchSearch =
        n.etudiant?.nomComplet?.toLowerCase().includes(t) ||
        n.etudiant?.matricule?.toLowerCase().includes(t) ||
        n.matiere?.toLowerCase().includes(t);
      const matchClasse = !filterClasse || n.classe === filterClasse;
      const matchTrimestre = !filterTrimestre || n.trimestre === Number(filterTrimestre);
      return matchSearch && matchClasse && matchTrimestre;
    });
  }, [notes, searchTerm, filterClasse, filterTrimestre]);

  // ==================== GROUPES PAR ÉTUDIANT ====================
  const groupes = useMemo(() => {
    const map = new Map();
    filteredNotes.forEach((n) => {
      const id = n.etudiant?._id?.toString();
      if (!id) return;
      if (!map.has(id)) map.set(id, { etudiant: n.etudiant, notes: [] });
      map.get(id).notes.push(n);
    });
    return Array.from(map.values())
      .map((g) => ({ ...g, moyenne: calculerMoyenne(g.notes) }))
      .sort((a, b) => b.moyenne - a.moyenne);
  }, [filteredNotes]);

  // ==================== CLASSES DISPO ====================
  const classesDisponibles = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => n.classe && set.add(n.classe));
    return Array.from(set).sort();
  }, [notes]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = filteredNotes.length;
    const moyenneGlobale = calculerMoyenne(filteredNotes);
    const reussite = groupes.filter((g) => g.moyenne >= 10).length;
    const echec = groupes.filter((g) => g.moyenne < 10).length;
    return { total, moyenneGlobale, reussite, echec };
  }, [filteredNotes, groupes]);

  // ==================== EXPAND ====================
  const toggleStudent = (id) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ✅ NOUVEAU : Tout replier / tout déplier
  const toggleAll = () => {
    if (expandedStudents.size === groupes.length) {
      setExpandedStudents(new Set());
    } else {
      setExpandedStudents(new Set(groupes.map((g) => g.etudiant._id.toString())));
    }
  };

  // ==================== DELETE ====================
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/allroute/notes/${deleteTarget._id}`);
      showNotification("success", "Note supprimée avec succès");
      setDeleteTarget(null);
      fetchNotes();
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // ==================== AJOUT RAPIDE ====================
  const handleQuickAdd = (etudiant) => {
    setQuickAddEtudiant(etudiant);
  };

  // ==================== APPRÉCIATION ====================
  const getAppreciation = (moy) => {
    if (moy >= 18) return { texte: "Excellent", bg: "bg-emerald-100", color: "text-emerald-700" };
    if (moy >= 16) return { texte: "Très Bien", bg: "bg-emerald-100", color: "text-emerald-700" };
    if (moy >= 14) return { texte: "Bien", bg: "bg-blue-100", color: "text-blue-700" };
    if (moy >= 12) return { texte: "Assez Bien", bg: "bg-blue-100", color: "text-blue-700" };
    if (moy >= 10) return { texte: "Passable", bg: "bg-amber-100", color: "text-amber-700" };
    if (moy >= 8)  return { texte: "Insuffisant", bg: "bg-orange-100", color: "text-orange-700" };
    return { texte: "Très Faible", bg: "bg-red-100", color: "text-red-700" };
  };

  // ==================== RENDER ====================
  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      {/* 🆕 MODAL AJOUT RAPIDE (note pour un étudiant précis) */}
      {quickAddEtudiant && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setQuickAddEtudiant(null)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={() => setQuickAddEtudiant(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
              >
                <X size={18} />
              </button>
              <AddNote
                preselectedEtudiant={quickAddEtudiant}
                onSuccess={() => {
                  setQuickAddEtudiant(null);
                  fetchNotes();
                }}
                onCancel={() => setQuickAddEtudiant(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteTarget && (
        <ConfirmDelete
          note={deleteTarget}
          loading={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* ===== 2 BOUTONS NAVIGATION ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setFormType("ajout")}
          className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
            formType === "ajout"
              ? "bg-gradient-to-r from-indigo-700 to-purple-900 scale-105"
              : "bg-gradient-to-r from-indigo-500 to-purple-700 hover:from-indigo-600 hover:to-purple-800"
          }`}
        >
          <div className="p-3 bg-white/20 rounded-xl">
            <Award size={24} />
          </div>
          <div className="text-left">
            <div className="text-lg">Ajouter une note</div>
            <div className="text-xs font-normal opacity-90">Nouvelle évaluation</div>
          </div>
        </button>

        <button
          onClick={() => { setFormType(null); fetchNotes(); }}
          className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
            formType === null
              ? "bg-gradient-to-r from-amber-700 to-amber-900 scale-105"
              : "bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
          }`}
        >
          <div className="p-3 bg-white/20 rounded-xl">
            <List size={24} />
          </div>
          <div className="text-left">
            <div className="text-lg">Liste</div>
            <div className="text-xs font-normal opacity-90">Toutes les notes</div>
          </div>
        </button>
      </div>

      {/* ===== FORMULAIRE AJOUT ===== */}
      {formType === "ajout" && (
        <div className="mb-8">
          <AddNote
            onSuccess={() => { setFormType(null); fetchNotes(); }}
            onCancel={() => setFormType(null)}
          />
        </div>
      )}

      {/* ===== LISTE ===== */}
      {formType === null && (
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<FileText size={22} />}
              label="TOTAL NOTES"
              value={stats.total}
              color={{ bg: "bg-indigo-100", text: "text-indigo-600", valueText: "text-indigo-700" }}
            />
            <StatCard
              icon={<Award size={22} />}
              label="MOYENNE"
              value={`${stats.moyenneGlobale.toFixed(2)}/20`}
              color={{ bg: "bg-purple-100", text: "text-purple-600", valueText: "text-purple-700" }}
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              label="RÉUSSITE"
              value={stats.reussite}
              color={{ bg: "bg-emerald-100", text: "text-emerald-600", valueText: "text-emerald-700" }}
            />
            <StatCard
              icon={<XCircle size={22} />}
              label="ÉCHEC"
              value={stats.echec}
              color={{ bg: "bg-red-100", text: "text-red-600", valueText: "text-red-700" }}
            />
          </div>

          {/* FILTRES */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher (nom, matricule, matière)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Toutes les classes</option>
                {classesDisponibles.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterTrimestre}
                onChange={(e) => setFilterTrimestre(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Tous les trimestres</option>
                <option value="1">1er Trimestre</option>
                <option value="2">2ème Trimestre</option>
                <option value="3">3ème Trimestre</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Layers size={22} className="text-indigo-600" />
                Notes par étudiant
                <span className="ml-2 text-sm font-normal bg-white text-gray-600 px-3 py-1 rounded-full">
                  {groupes.length} étudiant(s) · {filteredNotes.length} note(s)
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={toggleAll}
                  className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold text-sm transition"
                >
                  {expandedStudents.size === groupes.length ? "Tout replier" : "Tout déplier"}
                </button>
                <button
                  onClick={fetchNotes}
                  className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition"
                  title="Rafraîchir"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
                Chargement...
              </div>
            ) : groupes.length === 0 ? (
              <div className="p-16 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune note trouvée</h3>
                <p className="text-gray-500">Ajoutez une note pour commencer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-gray-600">Étudiant</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-600">Matière</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-600">Classe / Niveau</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-600">Note</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-600">Coef</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-600">Type</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-600">Trim.</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupes.map((g, index) => {
                      const isExpanded = expandedStudents.has(g.etudiant._id.toString());
                      const app = getAppreciation(g.moyenne);
                      const isTop = index === 0;

                      return (
                        <React.Fragment key={g.etudiant._id}>
                          {/* ===== LIGNE ÉTUDIANT (cliquable) ===== */}
                          <tr className={`border-b-2 border-indigo-200 ${isTop ? "bg-yellow-50/40" : "bg-indigo-50/30"}`}>
                            <td colSpan={9} className="p-3">
                              <div className="flex items-center gap-3">
                                {/* Bouton d'expansion */}
                                <button
                                  onClick={() => toggleStudent(g.etudiant._id.toString())}
                                  className="flex items-center gap-3 flex-1 text-left hover:bg-white/60 rounded-xl p-2 transition group"
                                  title={isExpanded ? "Replier" : "Voir toutes ses notes"}
                                >
                                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-white group-hover:bg-indigo-100 transition">
                                    {isExpanded ? (
                                      <ChevronDown size={18} className="text-indigo-600" />
                                    ) : (
                                      <ChevronRight size={18} className="text-indigo-600" />
                                    )}
                                  </div>

                                  {g.etudiant.photo ? (
                                    <img
                                      src={`http://localhost:4999${g.etudiant.photo}`}
                                      alt=""
                                      className="w-11 h-11 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                      {g.etudiant.prenom?.[0]}{g.etudiant.nom?.[0]}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800">{g.etudiant.nomComplet}</div>
                                    <div className="text-xs text-gray-500 font-mono">
                                      {g.etudiant.matricule}
                                    </div>
                                  </div>

                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                    <FileText size={11} />
                                    {g.notes.length} note(s)
                                  </span>

                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${app.bg} ${app.color}`}>
                                    {g.moyenne.toFixed(2)}/20
                                  </span>
                                </button>

                                {/* ✅ BOUTON + AJOUTER NOTE POUR CET ÉTUDIANT */}
                                <button
                                  onClick={() => handleQuickAdd(g.etudiant)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                  title="Ajouter une note à cet étudiant"
                                >
                                  <Plus size={16} strokeWidth={3} />
                                  Ajouter
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* ===== LIGNES NOTES (si déplié) ===== */}
                          {isExpanded && g.notes.map((note) => {
                            const noteApp = getAppreciation(note.note);
                            return (
                              <tr key={note._id} className="border-b border-gray-100 hover:bg-gray-50/70 transition">
                                <td className="p-3 pl-16">
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <ChevronRight size={12} />
                                    <span>note</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                                    <BookOpen size={10} /> {note.matiere}
                                  </span>
                                </td>
                                <td className="p-3 text-sm text-gray-700">
                                  {note.classe} <span className="text-xs text-gray-500">· {note.niveau}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-sm ${noteApp.bg} ${noteApp.color}`}>
                                    {note.note}/20
                                  </span>
                                </td>
                                <td className="p-3 text-center text-sm font-semibold text-gray-600">
                                  ×{note.coefficient}
                                </td>
                                <td className="p-3 text-center text-sm text-gray-700">
                                  {note.type}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                                    T{note.trimestre}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {new Date(note.dateEvaluation).toLocaleDateString("fr-FR")}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex justify-center gap-1.5">
                                    {/* Voir - via modal éditable simplifié */}
                                    <button
                                      onClick={() => { /* Voir - redirige vers édition */ }}
                                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                      title="Voir"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      onClick={() => { /* Éditer - ouvrir modal édition */ }}
                                      className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                                      title="Modifier"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    {/* ✅ BOUTON + RAPIDE */}
                                    <button
                                      onClick={() => handleQuickAdd(g.etudiant)}
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                      title="Ajouter une note pour cet étudiant"
                                    >
                                      <Plus size={14} strokeWidth={2.5} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget(note)}
                                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER INFO */}
          {groupes.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap gap-4 items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-indigo-800">
                <Info size={16} />
                <span>Cliquez sur <strong>un étudiant</strong> pour voir toutes ses notes</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <Plus size={16} />
                <span>Bouton <strong>+</strong> pour ajouter une note rapidement</span>
              </div>
            </div>
          )}
        </>
      )}

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
    </div>
  );
};

export default ListeNotes;