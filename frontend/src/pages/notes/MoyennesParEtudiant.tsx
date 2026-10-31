// @ts-nocheck
import React, { useState, useMemo } from "react";
import {
  ChevronDown, ChevronRight, Users, Award,
  TrendingUp, TrendingDown, BookOpen, Search
} from "lucide-react";

// ==================== FORMAT ====================
const getAppreciation = (moyenne) => {
  if (moyenne >= 18) return { texte: "Excellent", color: "text-emerald-700", bg: "bg-emerald-100" };
  if (moyenne >= 16) return { texte: "Très Bien", color: "text-emerald-700", bg: "bg-emerald-100" };
  if (moyenne >= 14) return { texte: "Bien", color: "text-blue-700", bg: "bg-blue-100" };
  if (moyenne >= 12) return { texte: "Assez Bien", color: "text-blue-700", bg: "bg-blue-100" };
  if (moyenne >= 10) return { texte: "Passable", color: "text-amber-700", bg: "bg-amber-100" };
  if (moyenne >= 8)  return { texte: "Insuffisant", color: "text-orange-700", bg: "bg-orange-100" };
  return { texte: "Très Faible", color: "text-red-700", bg: "bg-red-100" };
};

// ==================== COMPOSANT ====================
const MoyennesParEtudiant = ({ notes = [], onSelectEtudiant }) => {
  const [expandedEtudiants, setExpandedEtudiants] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Regrouper les notes par étudiant
  const groupes = useMemo(() => {
    const parEtudiant = {};
    notes.forEach((n) => {
      const eid = n.etudiant?._id?.toString();
      if (!eid) return;
      if (!parEtudiant[eid]) {
        parEtudiant[eid] = {
          etudiant: n.etudiant,
          notes: [],
        };
      }
      parEtudiant[eid].notes.push(n);
    });

    // Calculer moyenne générale par étudiant
    const result = Object.values(parEtudiant).map(({ etudiant, notes: notesE }) => {
      // Grouper par matière
      const parMatiere = {};
      notesE.forEach((n) => {
        if (!parMatiere[n.matiere]) parMatiere[n.matiere] = [];
        parMatiere[n.matiere].push(n);
      });

      // Moyenne par matière
      const matieres = Object.entries(parMatiere).map(([matiere, notesM]) => {
        const total = notesM.reduce((s, n) => s + n.note * n.coefficient, 0);
        const coef = notesM.reduce((s, n) => s + n.coefficient, 0);
        return {
          matiere,
          moyenne: coef > 0 ? total / coef : 0,
          nombreNotes: notesM.length,
          coefficient: coef,
        };
      });

      // Moyenne générale pondérée
      const total = matieres.reduce((s, m) => s + m.moyenne * m.coefficient, 0);
      const coefTotal = matieres.reduce((s, m) => s + m.coefficient, 0);
      const moyenneGenerale = coefTotal > 0 ? total / coefTotal : 0;

      return {
        etudiant,
        notes: notesE,
        matieres,
        moyenneGenerale,
        nombreNotes: notesE.length,
        nombreMatieres: matieres.length,
      };
    });

    // Trier par moyenne décroissante
    result.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);
    return result;
  }, [notes]);

  // ✅ Filtrer par recherche
  const filteredGroupes = groupes.filter((g) => {
    const t = searchTerm.toLowerCase();
    return (
      g.etudiant.nomComplet?.toLowerCase().includes(t) ||
      g.etudiant.matricule?.toLowerCase().includes(t)
    );
  });

  const toggleEtudiant = (id) => {
    setExpandedEtudiants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (groupes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* HEADER */}
      <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Award size={20} className="text-purple-600" />
          Moyennes par étudiant
          <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
            {filteredGroupes.length}
          </span>
        </h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Rechercher étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 w-56"
          />
        </div>
      </div>

      {/* LISTE DES ÉTUDIANTS */}
      <div className="divide-y divide-gray-100">
        {filteredGroupes.map((g, index) => {
          const appreciation = getAppreciation(g.moyenneGenerale);
          const isExpanded = expandedEtudiants.has(g.etudiant._id);
          const isTop = index === 0;
          const isFail = g.moyenneGenerale < 10;

          return (
            <div key={g.etudiant._id} className={isTop ? "bg-yellow-50/40" : ""}>
              {/* LIGNE PRINCIPALE */}
              <button
                onClick={() => toggleEtudiant(g.etudiant._id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
              >
                {/* Rang */}
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm flex-shrink-0 ${
                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md"
                    : index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                    : index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                    : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Photo + Nom */}
                {g.etudiant.photo ? (
                  <img
                    src={`http://localhost:4999${g.etudiant.photo}`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {g.etudiant.prenom?.[0]}{g.etudiant.nom?.[0]}
                  </div>
                )}

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    {g.etudiant.nomComplet}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {g.etudiant.matricule} · {g.nombreNotes} note(s) · {g.nombreMatieres} matière(s)
                  </div>
                </div>

                {/* Moyenne */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1 ${appreciation.bg} ${appreciation.color}`}>
                    {g.moyenneGenerale.toFixed(2)}/20
                    {isFail
                      ? <TrendingDown size={14} />
                      : <TrendingUp size={14} />
                    }
                  </div>
                  <span className="hidden sm:block text-xs text-gray-500 font-medium min-w-[80px] text-right">
                    {appreciation.texte}
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* DÉTAIL EXPANDABLE */}
              {isExpanded && (
                <div className="px-4 pb-4 pl-16 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {g.matieres.map((m) => {
                      const appMat = getAppreciation(m.moyenne);
                      return (
                        <div
                          key={m.matiere}
                          className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-gray-200"
                        >
                          <BookOpen size={14} className="text-indigo-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-700 truncate">
                              {m.matiere}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {m.nombreNotes} note(s) · coef ×{m.coefficient}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${appMat.bg} ${appMat.color}`}>
                            {m.moyenne.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER STATS GLOBALES */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {groupes.length} étudiant(s) au total
        </span>
        <span className="flex items-center gap-1">
          <Award size={12} />
          Moyenne de classe :{" "}
          <strong>
            {(groupes.reduce((s, g) => s + g.moyenneGenerale, 0) / groupes.length).toFixed(2)}/20
          </strong>
        </span>
        <span className="flex items-center gap-1 text-emerald-600">
          ✅ {groupes.filter((g) => g.moyenneGenerale >= 10).length} réussi(s)
        </span>
        <span className="flex items-center gap-1 text-red-600">
          ❌ {groupes.filter((g) => g.moyenneGenerale < 10).length} échec(s)
        </span>
      </div>
    </div>
  );
};

export default MoyennesParEtudiant;