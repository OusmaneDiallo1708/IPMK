// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  X, RefreshCw, CheckCircle, XCircle, Info, Plus, Trash2,
  Banknote, TrendingUp, AlertCircle, Save, Edit,
  FileText, Printer, Download, Calendar, Wallet,
  User, GraduationCap, School, CreditCard, PieChart,
  ChevronRight, Sparkles, Award, Clock, MoreHorizontal,
  Smartphone, Landmark
} from "lucide-react";
import html2pdf from "html2pdf.js";
import api from "../../config/axiosConfig";
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
    <div className="fixed top-6 right-6 z-[110] animate-slide-in-right">
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

const getModePaiementColor = (mode) => {
  const map = {
    "Espèces":        "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Mobile Money":   "bg-orange-100 text-orange-700 border-orange-200",
    "Virement":       "bg-blue-100 text-blue-700 border-blue-200",
    "Chèque":         "bg-purple-100 text-purple-700 border-purple-200",
    "Orange Money":   "bg-orange-100 text-orange-700 border-orange-200",
    "Autre paiement": "bg-gray-100 text-gray-700 border-gray-200",
  };
  return map[mode] || "bg-gray-100 text-gray-700 border-gray-200";
};

const getModePaiementIcon = (mode) => {
  const map = {
    "Espèces":        <Wallet size={12} />,
    "Mobile Money":   <Smartphone size={12} />,
    "Virement":       <Landmark size={12} />,
    "Chèque":         <CreditCard size={12} />,
    "Orange Money":   <Smartphone size={12} />,
    "Autre paiement": <MoreHorizontal size={12} />,
  };
  return map[mode] || <Banknote size={12} />;
};

// ==================== COMPOSANT STAT CARD ====================
const StatCard = ({ icon, label, value, gradient, iconBg, iconColor, big }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 border-2 ${gradient} group hover:shadow-xl transition-all duration-300`}>
    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/30 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-extrabold ${big ? "text-3xl" : "text-2xl"}`}>{value}</p>
    </div>
  </div>
);

// ==================== COMPOSANT PRINCIPAL ====================
const FicheEleve = ({ etudiant, anneeScolaire, onClose, onUpdate, onNotify }) => {
  const [fiche, setFiche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });
  const recuRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    onNotify?.(type, message);
  };

  const fetchFiche = async () => {
    setLoading(true);
    try {
      const params = {};
      if (anneeScolaire) params.anneeScolaire = anneeScolaire;

      const res = await api.get(
        `/api/allroute/comptabilite/eleves/${etudiant._id}/fiche`,
        { params }
      );
      setFiche(res.data.fiche);
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Impossible de charger la fiche");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiche(); }, [etudiant._id, anneeScolaire]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/allroute/comptabilite/paiements/${deleteTarget._id}`);
      showNotification("success", "Paiement supprimé avec succès");
      setDeleteTarget(null);
      fetchFiche();
      onUpdate?.();
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Erreur suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadRecu = async (paiement) => {
    setDownloadingPdf(true);
    showNotification("info", "Génération du reçu...");

    try {
      const recuHTML = document.createElement("div");
      recuHTML.style.padding = "40px";
      recuHTML.style.fontFamily = "Arial, sans-serif";
      recuHTML.style.background = "white";
      recuHTML.innerHTML = `
        <div style="text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">I.P.M.K</h1>
          <p style="color: #666; margin: 5px 0;">Institut Polytechnique Moderne de Kindia</p>
          <h2 style="color: #333; margin-top: 20px; font-size: 22px;">REÇU DE PAIEMENT N° ${paiement.numeroRecu}</h2>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Informations de l'élève</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Nom complet :</td><td>${etudiant.nomComplet}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Matricule :</td><td>${etudiant.matricule}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Classe :</td><td>${etudiant.classe || "-"}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Année scolaire :</td><td>${paiement.anneeScolaire}</td></tr>
          </table>
        </div>

        <div style="margin-bottom: 30px; background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #4f46e5;">
          <h3 style="color: #4f46e5; margin-top: 0;">Détails du paiement</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Type :</td><td>${paiement.typePaiement}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Montant :</td><td style="font-size: 20px; color: #059669; font-weight: bold;">${formatGNF(paiement.montant)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Mode de paiement :</td><td>${paiement.modePaiement}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Date :</td><td>${new Date(paiement.datePaiement).toLocaleDateString("fr-FR")}</td></tr>
            ${paiement.commentaire ? `<tr><td style="padding: 8px 0; font-weight: bold;">Commentaire :</td><td>${paiement.commentaire}</td></tr>` : ""}
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Résumé financier</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0;">Total dû :</td><td style="text-align: right; font-weight: bold;">${formatGNF(fiche.totalDu)}</td></tr>
            <tr><td style="padding: 8px 0;">Total payé :</td><td style="text-align: right; font-weight: bold; color: #059669;">${formatGNF(fiche.totalPaye)}</td></tr>
            <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 12px 0; font-weight: bold; font-size: 16px;">Reste à payer :</td><td style="text-align: right; font-weight: bold; font-size: 16px; color: ${fiche.resteAPayer > 0 ? "#dc2626" : "#059669"};">${formatGNF(fiche.resteAPayer)}</td></tr>
          </table>
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 45%;">
            <p style="border-top: 1px dashed #999; padding-top: 10px; color: #666;">Le Comptable</p>
          </div>
          <div style="text-align: center; width: 45%;">
            <p style="border-top: 1px dashed #999; padding-top: 10px; color: #666;">Le Directeur</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #999;">
          Document généré automatiquement le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
        </div>
      `;

      const options = {
        margin: [10, 10, 10, 10],
        filename: `Recu_${paiement.numeroRecu}_${etudiant.nomComplet?.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(options).from(recuHTML).save();
      showNotification("success", "Reçu téléchargé avec succès ! 🎉");
    } catch (error) {
      console.error("❌ Erreur PDF:", error);
      showNotification("error", "Erreur lors du téléchargement du reçu");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ✅ Progression arrondie
  const progressionArrondie = fiche ? Math.min(100, Math.round(fiche.progression || 0)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/60 backdrop-blur-md overflow-y-auto">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      {showAddPaiement && fiche && (
        <AddPaiement
          etudiant={fiche.etudiant}
          resteAPayer={fiche.resteAPayer}
          onClose={() => setShowAddPaiement(false)}
          onSuccess={() => {
            setShowAddPaiement(false);
            fetchFiche();
            onUpdate?.();
          }}
          onNotify={showNotification}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={40} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
              <p className="text-gray-600 text-sm">
                Supprimer le paiement <strong className="font-mono">{deleteTarget.numeroRecu}</strong> de{" "}
                <strong>{formatGNF(deleteTarget.montant)}</strong> ?
                <br />Cette action est irréversible.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transition"
              >
                {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in mb-8">
        {/* HEADER */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4 text-white">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Wallet size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Fiche de paiement</h2>
                  <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                </div>
                <p className="text-sm text-white/80 flex items-center gap-2 mt-1">
                  <User size={14} />
                  {etudiant.nomComplet}
                  <span className="opacity-60">·</span>
                  <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {etudiant.matricule}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
              <RefreshCw className="animate-spin text-indigo-600" size={40} />
            </div>
            <p className="text-gray-600 font-medium">Chargement de la fiche...</p>
          </div>
        ) : fiche ? (
          <div className="p-6 space-y-6">
            {/* INFOS ÉLÈVE */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100">
              <div className="flex items-center gap-5">
                <div className="relative">
                  {fiche.etudiant.photo ? (
                    <img
                      src={`http://localhost:4999${fiche.etudiant.photo}`}
                      alt=""
                      className="w-24 h-24 rounded-2xl object-cover shadow-xl ring-4 ring-white"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl ring-4 ring-white">
                      {fiche.etudiant.nomComplet?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  {fiche.resteAPayer <= 0 && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-3 border-white flex items-center justify-center shadow-lg">
                      <CheckCircle size={18} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{fiche.etudiant.nomComplet}</h3>
                  <p className="text-sm text-gray-500 font-mono mb-3">{fiche.etudiant.matricule}</p>
                  <div className="flex flex-wrap gap-2">
                    {fiche.etudiant.classe && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-bold border border-indigo-200">
                        <School size={12} /> {fiche.etudiant.classe}
                      </span>
                    )}
                    {fiche.etudiant.niveau && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold border border-purple-200">
                        <GraduationCap size={12} /> {fiche.etudiant.niveau}
                      </span>
                    )}
                    {fiche.etudiant.anneeScolaire && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full font-bold border border-pink-200">
                        <Calendar size={12} /> {fiche.etudiant.anneeScolaire}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`hidden md:flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 ${
                  fiche.resteAPayer <= 0
                    ? "bg-emerald-50 border-emerald-300"
                    : fiche.totalPaye > 0
                    ? "bg-amber-50 border-amber-300"
                    : "bg-red-50 border-red-300"
                }`}>
                  {fiche.resteAPayer <= 0 ? (
                    <><Award className="text-emerald-600" size={28} /><span className="text-xs font-bold text-emerald-700">À JOUR</span></>
                  ) : fiche.totalPaye > 0 ? (
                    <><Clock className="text-amber-600" size={28} /><span className="text-xs font-bold text-amber-700">EN COURS</span></>
                  ) : (
                    <><AlertCircle className="text-red-600" size={28} /><span className="text-xs font-bold text-red-700">IMPAYÉ</span></>
                  )}
                </div>
              </div>
            </div>

            {/* RÉSUMÉ FINANCIER */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <PieChart size={16} className="text-indigo-600" />
                Résumé financier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon={<Wallet size={20} />}
                  label="Total dû"
                  value={formatGNF(fiche.totalDu)}
                  gradient="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200"
                  iconBg="bg-indigo-100"
                  iconColor="text-indigo-600"
                />
                <StatCard
                  icon={<TrendingUp size={20} />}
                  label="Total payé"
                  value={formatGNF(fiche.totalPaye)}
                  gradient="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                  iconBg="bg-emerald-100"
                  iconColor="text-emerald-600"
                />
                <StatCard
                  icon={<AlertCircle size={20} />}
                  label="Reste à payer"
                  value={formatGNF(fiche.resteAPayer)}
                  gradient={
                    fiche.resteAPayer > 0
                      ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-300"
                      : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300"
                  }
                  iconBg={fiche.resteAPayer > 0 ? "bg-red-100" : "bg-emerald-100"}
                  iconColor={fiche.resteAPayer > 0 ? "text-red-600" : "text-emerald-600"}
                  big
                />
              </div>
            </div>

            {/* PROGRESSION */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <PieChart size={14} className="text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Progression du paiement</span>
                </div>
                <span className={`text-2xl font-extrabold ${
                  progressionArrondie === 100 ? "text-emerald-600" :
                  progressionArrondie >= 50 ? "text-amber-600" : "text-red-600"
                }`}>
                  {progressionArrondie}%
                </span>
              </div>
              <div className="relative w-full h-5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
                    progressionArrondie === 100
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                      : progressionArrondie >= 50
                      ? "bg-gradient-to-r from-amber-400 to-orange-500"
                      : "bg-gradient-to-r from-red-400 to-rose-600"
                  }`}
                  style={{ width: `${progressionArrondie}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* BOUTON AJOUTER */}
            <button
              onClick={() => setShowAddPaiement(true)}
              disabled={fiche.resteAPayer <= 0}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 text-lg ${
                fiche.resteAPayer <= 0
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-2xl"
              }`}
            >
              {fiche.resteAPayer <= 0 ? (
                <><CheckCircle size={24} />Élève totalement payé</>
              ) : (
                <><Plus size={24} />Ajouter un paiement<ChevronRight size={20} /></>
              )}
            </button>

            {/* HISTORIQUE */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <FileText size={18} className="text-indigo-600" />
                  </div>
                  Historique des paiements
                  <span className="ml-1 text-sm font-normal bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    {fiche.paiements.length}
                  </span>
                </h3>
              </div>

              {fiche.paiements.length === 0 ? (
                <div className="p-12 text-center bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Banknote size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-1">Aucun paiement enregistré</p>
                  <p className="text-gray-500 text-sm">Les paiements apparaîtront ici une fois ajoutés.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fiche.paiements.map((p, index) => (
                    <div
                      key={p._id}
                      className="group relative bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        p.typePaiement === "Scolarité" ? "bg-indigo-500" :
                        p.typePaiement === "Inscription" ? "bg-blue-500" :
                        p.typePaiement === "Tenue" ? "bg-purple-500" :
                        "bg-gray-400"
                      }`}></div>

                      <div className="flex items-center justify-between gap-4 flex-wrap pl-3">
                        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                          <div className="relative">
                            <div className={`p-3 rounded-xl ${
                              p.typePaiement === "Scolarité" ? "bg-indigo-50 text-indigo-600" :
                              p.typePaiement === "Inscription" ? "bg-blue-50 text-blue-600" :
                              p.typePaiement === "Tenue" ? "bg-purple-50 text-purple-600" :
                              "bg-gray-50 text-gray-600"
                            }`}>
                              <Banknote size={22} />
                            </div>
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                              {index + 1}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-extrabold text-gray-800 text-lg">
                                {formatGNF(p.montant)}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${getModePaiementColor(p.modePaiement)}`}>
                                {getModePaiementIcon(p.modePaiement)}
                                {p.modePaiement}
                              </span>
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                                {p.typePaiement}
                              </span>
                              {p.trimestre && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-bold">
                                  T{p.trimestre}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(p.datePaiement).toLocaleDateString("fr-FR", {
                                  day: "2-digit", month: "short", year: "numeric"
                                })}
                              </span>
                              <span className="font-mono flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded">
                                🎫 {p.numeroRecu}
                              </span>
                            </div>

                            {p.commentaire && (
                              <p className="text-xs text-gray-500 mt-1.5 italic flex items-start gap-1">
                                <span>💬</span>
                                <span>{p.commentaire}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadRecu(p)}
                            disabled={downloadingPdf}
                            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 transition-all text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                            title="Télécharger le reçu PDF"
                          >
                            <Download size={14} />
                            Reçu
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-16 text-center">
            <AlertCircle size={48} className="mx-auto text-amber-400 mb-3" />
            <p className="text-gray-500">Impossible de charger la fiche</p>
          </div>
        )}
      </div>

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
        .animate-scale-in { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default FicheEleve;