// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Search, X, RefreshCw, CheckCircle, XCircle, Info,
  Award, Printer, Download, User, BookOpen, TrendingUp,
  Trophy, Star, AlertCircle, Calendar
} from "lucide-react";
import html2pdf from "html2pdf.js"; // 🆕 AJOUT
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
    <div className="fixed top-6 right-6 z-[100] animate-slide-in-right print:hidden">
      <div className={`bg-gradient-to-r ${config.bg} text-white rounded-2xl shadow-2xl max-w-md flex items-start p-4 gap-3 border border-white/20`}>
        <div className="bg-white/20 rounded-xl p-2">{config.icon}</div>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
    </div>
  );
};

// ==================== COULEUR APPRÉCIATION ====================
const getAppreciationColor = (texte) => {
  const map = {
    "Excellent": "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Très Bien": "bg-green-100 text-green-700 border-green-300",
    "Bien": "bg-blue-100 text-blue-700 border-blue-300",
    "Assez Bien": "bg-indigo-100 text-indigo-700 border-indigo-300",
    "Passable": "bg-amber-100 text-amber-700 border-amber-300",
    "Insuffisant": "bg-orange-100 text-orange-700 border-orange-300",
    "Très Faible": "bg-red-100 text-red-700 border-red-300",
  };
  return map[texte] || "bg-gray-100 text-gray-700 border-gray-300";
};

const getNoteColor = (note) => {
  if (note >= 16) return "text-emerald-600";
  if (note >= 14) return "text-green-600";
  if (note >= 12) return "text-blue-600";
  if (note >= 10) return "text-amber-600";
  return "text-red-600";
};

// ==================== COMPOSANT PRINCIPAL ====================
const Bulletin = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [bulletin, setBulletin] = useState(null);
  const [loadingBulletin, setLoadingBulletin] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false); // 🆕 AJOUT
  const [trimestre, setTrimestre] = useState("1");
  const [anneeScolaire, setAnneeScolaire] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });
  const bulletinRef = useRef(null);

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

  // ==================== CHARGER LES ÉTUDIANTS ====================
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

  useEffect(() => { fetchEtudiants(); }, []);

  // ==================== CHARGER LE BULLETIN ====================
  const fetchBulletin = async () => {
    if (!selectedEtudiant) return;
    setLoadingBulletin(true);
    try {
      const params = {};
      if (trimestre) params.trimestre = trimestre;
      if (anneeScolaire) params.anneeScolaire = anneeScolaire;

      const res = await api.get(
        `/api/allroute/notes/etudiant/${selectedEtudiant._id}/bulletin`,
        { params }
      );

      if (res.data.bulletin) {
        setBulletin(res.data.bulletin);
        showNotification("success", "Bulletin généré avec succès !");
      } else {
        setBulletin(null);
        showNotification("info", "Aucune note pour cet étudiant sur cette période");
      }
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Erreur lors de la génération du bulletin");
      setBulletin(null);
    } finally {
      setLoadingBulletin(false);
    }
  };

  useEffect(() => {
    if (selectedEtudiant) fetchBulletin();
  }, [selectedEtudiant, trimestre, anneeScolaire]);

  // ==================== IMPRESSION ====================
  const handlePrint = () => {
    window.print();
  };

  // ==================== TÉLÉCHARGER PDF ==================== 🆕 AJOUT
  const handleDownloadPdf = async () => {
    if (!bulletinRef.current || !bulletin) return;

    setDownloadingPdf(true);
    showNotification("info", "Génération du PDF en cours...");

    try {
      const nomEleve = bulletin.etudiant.nomComplet?.replace(/\s+/g, "_") || "Etudiant";
      const periode = bulletin.periode.trimestre === "Année"
        ? "Annee"
        : `T${bulletin.periode.trimestre}`;
      const nomFichier = `Bulletin_${nomEleve}_${periode}_${bulletin.periode.anneeScolaire}.pdf`;

      const options = {
        margin: [5, 5, 5, 5],
        filename: nomFichier,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(options).from(bulletinRef.current).save();

      showNotification("success", "PDF téléchargé avec succès ! 🎉");
    } catch (error) {
      console.error("❌ Erreur téléchargement PDF:", error);
      showNotification("error", "Erreur lors du téléchargement du PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ==================== FILTRE ====================
  const filteredEtudiants = etudiants.filter((e) => {
    const t = searchTerm.toLowerCase();
    return (
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.derniereClasse?.toLowerCase().includes(t) ||
      e.classe?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(s => ({ ...s, show: false }))}
        />
      )}

      {/* ===== HEADER ===== */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 print:hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Award size={24} className="text-indigo-600" />
            Générer un bulletin
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={trimestre}
              onChange={(e) => setTrimestre(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Année complète</option>
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>

            <input
              type="text"
              placeholder="Année scolaire (ex: 2025-2026)"
              value={anneeScolaire}
              onChange={(e) => setAnneeScolaire(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Sélection étudiant */}
        {!selectedEtudiant ? (
          <div className="p-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un étudiant (nom, matricule, classe)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredEtudiants.map((e) => (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() => setSelectedEtudiant(e)}
                    className="flex items-center gap-3 w-full p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition text-left"
                  >
                    {e.photo ? (
                      <img src={`http://localhost:4999${e.photo}`} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {e.prenom?.[0]}{e.nom?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                      <div className="text-xs text-gray-500">
                        {e.matricule} · {e.derniereClasse || e.classe || "Classe inconnue"}
                      </div>
                      {(e.dernierNiveau || e.derniereOption) && (
                        <div className="text-xs text-indigo-500 font-medium mt-0.5">
                          {e.dernierNiveau} {e.derniereOption && `· ${e.derniereOption}`}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {selectedEtudiant.photo ? (
                <img src={`http://localhost:4999${selectedEtudiant.photo}`} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedEtudiant.prenom?.[0]}{selectedEtudiant.nom?.[0]}
                </div>
              )}
              <div>
                <div className="font-bold text-gray-800 text-lg">{selectedEtudiant.nomComplet}</div>
                <div className="text-xs text-gray-500 font-mono">{selectedEtudiant.matricule}</div>
              </div>
            </div>
            <button
              onClick={() => { setSelectedEtudiant(null); setBulletin(null); }}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* ===== BULLETIN ===== */}
      {loadingBulletin ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-lg">
          <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
          Génération du bulletin...
        </div>
      ) : bulletin ? (
        <>
          {/* 🆕 BOUTONS D'ACTION */}
          <div className="flex justify-end gap-3 mb-4 print:hidden">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingPdf ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Génération...
                </>
              ) : (
                <>
                  <Download size={18} /> Télécharger PDF
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg flex items-center gap-2 transition"
            >
              <Printer size={18} /> Imprimer
            </button>
          </div>

          {/* BULLETIN IMPRIMABLE */}
          <div ref={bulletinRef} className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden print:shadow-none print:rounded-none">
            {/* Header du bulletin */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold">BULLETIN SCOLAIRE</h1>
                  <p className="text-indigo-100 text-sm mt-1">
                    {bulletin.periode.trimestre === "Année" ? "Année complète" : `${bulletin.periode.trimestre}ème Trimestre`}
                    {" · "}
                    {bulletin.periode.anneeScolaire}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-90">Généré le</p>
                  <p className="text-sm font-semibold">
                    {new Date(bulletin.dateGeneration).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Infos étudiant */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-indigo-50 border-b">
              <div className="flex items-center gap-4">
                {bulletin.etudiant.photo ? (
                  <img src={`http://localhost:4999${bulletin.etudiant.photo}`} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {bulletin.etudiant.nomComplet?.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{bulletin.etudiant.nomComplet}</h2>
                  <p className="text-sm text-gray-600 font-mono">Matricule: {bulletin.etudiant.matricule}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bulletin.etudiant.classe && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                        📚 {bulletin.etudiant.classe}
                      </span>
                    )}
                    {bulletin.etudiant.niveau && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                        🎓 {bulletin.etudiant.niveau}
                      </span>
                    )}
                    {bulletin.etudiant.option && (
                      <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold">
                        📖 {bulletin.etudiant.option}
                      </span>
                    )}
                  </div>
                </div>

                {bulletin.rang && (
                  <div className="text-center bg-white rounded-2xl p-4 shadow-md border-2 border-amber-300">
                    <Trophy className="text-amber-500 mx-auto mb-1" size={28} />
                    <p className="text-xs text-gray-500 font-semibold">RANG</p>
                    <p className="text-2xl font-extrabold text-amber-600">
                      {bulletin.rang}<span className="text-sm text-gray-400">/{bulletin.totalEtudiants}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tableau des matières */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                Détail par matière
              </h3>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-100 to-purple-100">
                    <tr>
                      <th className="text-left p-4 text-sm font-bold text-gray-700">Matière</th>
                      <th className="text-center p-4 text-sm font-bold text-gray-700">Moyenne /20</th>
                      <th className="text-center p-4 text-sm font-bold text-gray-700">Coef</th>
                      <th className="text-center p-4 text-sm font-bold text-gray-700">Points</th>
                      <th className="text-left p-4 text-sm font-bold text-gray-700">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletin.lignes.map((l, i) => (
                      <tr key={i} className="border-b hover:bg-indigo-50/30 transition">
                        <td className="p-4 font-semibold text-gray-800">{l.matiere}</td>
                        <td className="p-4 text-center">
                          <span className={`text-lg font-bold ${getNoteColor(l.moyenne)}`}>
                            {l.moyenne.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 text-center text-gray-700 font-semibold">×{l.coefficient}</td>
                        <td className="p-4 text-center text-gray-700 font-semibold">{l.points.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getAppreciationColor(l.appreciation)}`}>
                            {l.appreciation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totaux */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-indigo-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">TOTAL POINTS</p>
                  <p className="text-2xl font-bold text-indigo-700">{bulletin.totaux.totalPoints.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">TOTAL COEFFICIENTS</p>
                  <p className="text-2xl font-bold text-purple-700">{bulletin.totaux.totalCoefficients}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-300">
                  <p className="text-xs text-gray-600 font-semibold mb-1">MOYENNE GÉNÉRALE</p>
                  <p className={`text-3xl font-extrabold ${getNoteColor(bulletin.totaux.moyenneGenerale)}`}>
                    {bulletin.totaux.moyenneGenerale.toFixed(2)}<span className="text-sm text-gray-400">/20</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Appréciation générale */}
            <div className="px-6 pb-6">
              <div className={`rounded-2xl p-6 border-2 ${getAppreciationColor(bulletin.appreciation.texte)}`}>
                <div className="flex items-start gap-4">
                  <div className="bg-white/60 rounded-2xl p-3">
                    <Star size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">Appréciation générale</h3>
                    <p className="text-2xl font-extrabold mb-1">{bulletin.appreciation.texte}</p>
                    {bulletin.appreciation.mention && (
                      <p className="text-sm font-semibold opacity-90">
                        🏆 Mention : {bulletin.appreciation.mention}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {bulletin.nombreMatieres} matière(s) · {bulletin.nombreNotes} note(s)
              </p>
              <p className="text-xs text-gray-500">
                Document généré automatiquement
              </p>
            </div>

            {/* Signatures */}
            <div className="px-6 py-6 border-t">
              <div className="px-36 text-right text-sm">
                {/* <div>
                  <p className="font-semibold text-gray-700 mb-12">Le Professeur Principal</p>
                  <div className="border-t-2 border-dashed border-gray-300 pt-2">
                    <p className="text-xs text-gray-500">Signature</p>
                  </div>
                </div> */}
                <div>
                  <p className="font-semibold text-gray-700 mb-12">Le Directeur des Etudes</p>
                  <div className="border-t-2 border-dashed border-gray-300 pt-2">
                    <p className="text-xs text-gray-500">Signature & Cachet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : selectedEtudiant ? (
        <div className="p-16 text-center bg-white rounded-2xl shadow-lg">
          <AlertCircle size={48} className="mx-auto text-amber-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune note trouvée</h3>
          <p className="text-gray-500">Cet étudiant n'a pas encore de notes pour cette période.</p>
        </div>
      ) : null}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }

        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [ref], .bg-white.rounded-2xl.shadow-2xl,
          [ref] * {
            visibility: visible;
          }
          [ref] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Bulletin;