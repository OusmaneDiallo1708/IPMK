// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Users, RefreshCw, Search, X, CheckCircle, XCircle, Info,
  Banknote, TrendingUp, AlertCircle, Eye, Wallet, Trophy,
  Filter, PiggyBank, Percent, Plus, Calendar
} from "lucide-react";
import api from "../../config/axiosConfig";
import FicheEleve from "./FicheEleve";
import BaremeFrais from "./BaremeFrais";
import AddPaiement from "./AddPaiement";

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

const formatGNF = (montant) => {
  if (!montant && montant !== 0) return "0 GNF";
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)) + " GNF";
};

const calculerProgression = (totalDu, totalPaye, reste) => {
  const du = Number(totalDu) || 0;
  const paye = Number(totalPaye) || 0;
  const r = Number(reste) || 0;
  if (du <= 0) return 0;
  if (r <= 0 || paye >= du) return 100;
  return Math.min(100, Math.round((paye / du) * 100));
};

const getStatutConfig = (statut) => {
  if (statut === "Payé") return { bg: "bg-green-100 text-green-700 border-green-300", icon: <CheckCircle size={14} />, label: "Payé" };
  if (statut === "Partiel") return { bg: "bg-amber-100 text-amber-700 border-amber-300", icon: <AlertCircle size={14} />, label: "Partiel" };
  if (statut === "Impayé") return { bg: "bg-red-100 text-red-700 border-red-300", icon: <XCircle size={14} />, label: "Impayé" };
  return { bg: "bg-gray-100 text-gray-700 border-gray-300", icon: <Info size={14} />, label: "Inconnu" };
};

// ==================== COMPOSANT PRINCIPAL ====================
const Comptabilite = () => {
  const currentYear = new Date().getFullYear();
  const nextYear = `${currentYear}-${currentYear + 1}`;

  const [eleves, setEleves] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  // ✅ Année par défaut = année courante
  const [anneeScolaire, setAnneeScolaire] = useState(nextYear);
  const [anneesDisponibles, setAnneesDisponibles] = useState([nextYear]);
  const [showBareme, setShowBareme] = useState(false);
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  // ✅ Charger les années disponibles (depuis barèmes + inscriptions)
  const fetchAnnees = async () => {
    try {
      const yearsSet = new Set([nextYear]);

      // Depuis les barèmes
      try {
        const resB = await api.get("/api/allroute/comptabilite/baremes");
        (resB.data.baremes || []).forEach((b) => {
          if (b.anneeScolaire) yearsSet.add(b.anneeScolaire);
        });
      } catch (e) {
        console.warn("Erreur barèmes années:", e);
      }

      // Depuis les étudiants (inscription actuelle)
      try {
        const resE = await api.get("/api/allroute/etudiant/tous");
        (resE.data.etudiants || resE.data.data || []).forEach((e) => {
          if (e.anneeInscriptionActuelle) yearsSet.add(e.anneeInscriptionActuelle);
        });
      } catch (e) {
        console.warn("Erreur étudiants années:", e);
      }

      const sorted = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
      setAnneesDisponibles(sorted);
      if (!sorted.includes(anneeScolaire) && sorted.length > 0) {
        setAnneeScolaire(sorted[0]);
      }
    } catch (error) {
      console.error("Erreur fetchAnnees:", error);
    }
  };

  const fetchEleves = async () => {
    if (!anneeScolaire) return;
    setLoading(true);
    try {
      const res = await api.get("/api/allroute/comptabilite/eleves", {
        params: { anneeScolaire },
      });
      setEleves(res.data.eleves || []);
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Impossible de charger les élèves");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!anneeScolaire) return;
    try {
      const res = await api.get("/api/allroute/comptabilite/stats", {
        params: { anneeScolaire },
      });
      setStats(res.data);
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  useEffect(() => {
    fetchAnnees();
  }, []);

  useEffect(() => {
    if (anneeScolaire) {
      fetchEleves();
      fetchStats();
    }
  }, [anneeScolaire]);

  const filteredEleves = eleves.filter((e) => {
    const t = searchTerm.toLowerCase();
    const matchSearch =
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.classe?.toLowerCase().includes(t);
    const matchStatut = !filtreStatut || e.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  const statsCalculees = {
    totalAttendu: Math.round(eleves.reduce((s, e) => s + (e.totalDu || 0), 0)),
    totalPerçu: Math.round(eleves.reduce((s, e) => s + (e.totalPaye || 0), 0)),
    resteAPercevoir: Math.round(eleves.reduce((s, e) => s + (e.resteAPayer || 0), 0)),
    elevesEnRetard: eleves.filter((e) => e.statut === "Impayé" || e.statut === "Partiel").length,
    elevesPayes: eleves.filter((e) => e.statut === "Payé").length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      {selectedEleve && (
        <FicheEleve
          etudiant={selectedEleve}
          anneeScolaire={anneeScolaire}
          onClose={() => setSelectedEleve(null)}
          onUpdate={() => { fetchEleves(); fetchStats(); }}
          onNotify={showNotification}
        />
      )}

      {showBareme && (
        <BaremeFrais
          onClose={() => { setShowBareme(false); fetchAnnees(); fetchEleves(); fetchStats(); }}
          onNotify={showNotification}
        />
      )}

      {/* ✅ Passe l'année en cours au modal de paiement */}
      {showAddPaiement && (
        <AddPaiement
          anneeScolaire={anneeScolaire}
          onClose={() => setShowAddPaiement(false)}
          onSuccess={() => {
            setShowAddPaiement(false);
            fetchEleves();
            fetchStats();
          }}
          onNotify={showNotification}
        />
      )}

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Banknote size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Comptabilité Scolaire</h1>
              <p className="text-indigo-100 text-sm">
                Gestion des paiements — <strong>Année {anneeScolaire}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddPaiement(true)}
              className="px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition shadow-lg flex items-center gap-2"
            >
              <Plus size={18} /> Nouveau paiement
            </button>
            <button
              onClick={() => setShowBareme(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
            >
              <Percent size={18} /> Configurer les frais
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-xl"><Wallet className="text-blue-600" size={22} /></div>
            <span className="text-xs text-gray-500 font-semibold">TOTAL ATTENDU</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatGNF(statsCalculees.totalAttendu)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-100 rounded-xl"><PiggyBank className="text-emerald-600" size={22} /></div>
            <span className="text-xs text-gray-500 font-semibold">TOTAL PERÇU</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatGNF(statsCalculees.totalPerçu)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-100 rounded-xl"><AlertCircle className="text-red-600" size={22} /></div>
            <span className="text-xs text-gray-500 font-semibold">RESTE À PERCEVOIR</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatGNF(statsCalculees.resteAPercevoir)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-amber-100 rounded-xl"><Trophy className="text-amber-600" size={22} /></div>
            <span className="text-xs text-gray-500 font-semibold">ÉLÈVES EN RETARD</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{statsCalculees.elevesEnRetard}</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher (nom, matricule, classe)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="Payé">✅ Payé</option>
            <option value="Partiel">⚠️ Partiel</option>
            <option value="Impayé">❌ Impayé</option>
          </select>

          {/* ✅ Sélecteur d'année (pas de texte libre) */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
            <select
              value={anneeScolaire}
              onChange={(e) => setAnneeScolaire(e.target.value)}
              className="pl-10 pr-8 py-3 w-full border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer font-semibold bg-indigo-50"
            >
              {anneesDisponibles.map((y) => (
                <option key={y} value={y}>
                  📅 Année scolaire {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LISTE ÉLÈVES */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={22} className="text-indigo-600" />
            Liste des élèves — {anneeScolaire}
            <span className="ml-2 text-sm font-normal bg-white text-gray-600 px-3 py-1 rounded-full">
              {filteredEleves.length}
            </span>
          </h2>
          <button
            onClick={() => { fetchEleves(); fetchStats(); }}
            className="p-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
            Chargement...
          </div>
        ) : filteredEleves.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun élève inscrit en {anneeScolaire}</h3>
            <p className="text-gray-500">Les élèves apparaîtront ici après leur inscription pour cette année.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Élève</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Classe</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-600">Total dû</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-600">Payé</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-600">Reste</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Progression</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Statut</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEleves.map((e) => {
                  const statutConf = getStatutConfig(e.statut);
                  const progression = calculerProgression(e.totalDu, e.totalPaye, e.resteAPayer);
                  const isComplete = progression === 100;
                  return (
                    <tr key={e._id} className={`border-b hover:bg-indigo-50/40 transition ${isComplete ? "bg-emerald-50/20" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {e.photo ? (
                            <img src={`http://localhost:4999${e.photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {e.nomComplet?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                            <div className="text-xs text-gray-500 font-mono">{e.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        <div className="font-semibold">{e.classe || "-"}</div>
                        {e.niveau && <div className="text-xs text-gray-500">{e.niveau}</div>}
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-800">{formatGNF(e.totalDu)}</td>
                      <td className="p-4 text-right font-semibold text-emerald-600">{formatGNF(e.totalPaye)}</td>
                      <td className={`p-4 text-right font-semibold ${e.resteAPayer <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {e.resteAPayer <= 0 ? "✓ Soldé" : formatGNF(e.resteAPayer)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isComplete ? "bg-emerald-500" : progression >= 50 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${progression}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${isComplete ? "text-emerald-600" : "text-gray-600"}`}>
                            {isComplete ? "✅ 100%" : `${progression}%`}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statutConf.bg}`}>
                          {statutConf.icon}
                          {statutConf.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedEleve(e)}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                            title="Voir la fiche"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setSelectedEleve(e)}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Payer"
                          >
                            <Plus size={16} />
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

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default Comptabilite;