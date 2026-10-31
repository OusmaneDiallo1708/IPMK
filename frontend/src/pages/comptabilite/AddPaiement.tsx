// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  X, RefreshCw, CheckCircle, XCircle, Info, Save,
  Banknote, Wallet, Calendar, FileText, DollarSign,
  Check, Lock, PieChart, TrendingUp, Search, User,
  AlertCircle, AlertTriangle, MoreHorizontal
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
    <div className="fixed top-6 right-6 z-[130] animate-slide-in-right">
      <div className={`bg-gradient-to-r ${config.bg} text-white rounded-2xl shadow-2xl max-w-md flex items-start p-4 gap-3`}>
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

const normaliserClasse = (c) => {
  if (!c) return "";
  return c.toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const MODES_PAIEMENT = [
  { label: "Espèces", icon: <Wallet size={16} />, needsComment: false },
  { label: "Autre paiement", icon: <MoreHorizontal size={16} />, needsComment: true },
];

const repartirTranches = (total) => {
  if (!total || total <= 0) return [0, 0, 0];
  const base = Math.floor(total / 3);
  const reste = total - base * 3;
  return [base + (reste > 0 ? 1 : 0), base + (reste > 1 ? 1 : 0), base];
};

// ==================== COMPOSANT PRINCIPAL ====================
const AddPaiement = ({
  etudiant: initialEtudiant,
  resteAPayer: initialReste,
  anneeScolaire: propAnneeScolaire,   // ✅ année imposée par le parent
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [etudiant, setEtudiant] = useState(initialEtudiant || null);
  const [etudiants, setEtudiants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingEtudiants, setLoadingEtudiants] = useState(false);

  const [fiche, setFiche] = useState(null);
  const [bareme, setBareme] = useState(null);
  const [tousBaremes, setTousBaremes] = useState([]);
  const [loadingFiche, setLoadingFiche] = useState(false);

  // ✅ L'année active = celle imposée, sinon celle de l'étudiant
  const anneeActive =
    propAnneeScolaire ||
    etudiant?.anneeScolaire ||
    etudiant?.anneeInscriptionActuelle ||
    "";

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmMontant, setConfirmMontant] = useState("");
  const [confirmDate, setConfirmDate] = useState(new Date().toLocaleDateString("fr-CA"));
  const [confirmCommentaire, setConfirmCommentaire] = useState("");
  const [confirmModePaiement, setConfirmModePaiement] = useState("Espèces");

  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    onNotify?.(type, message);
  };

  useEffect(() => {
    if (initialEtudiant) return;
    const fetchEtudiants = async () => {
      setLoadingEtudiants(true);
      try {
        const res = await api.get("/api/allroute/etudiant/tous");
        setEtudiants(res.data.etudiants || res.data.data || []);
      } catch (err) {
        showNotification("error", "Impossible de charger les étudiants");
      } finally {
        setLoadingEtudiants(false);
      }
    };
    fetchEtudiants();
  }, [initialEtudiant]);

  // ✅ Charger la fiche pour l'année active
  useEffect(() => {
    if (!etudiant?._id || !anneeActive) return;

    const fetchAll = async () => {
      setLoadingFiche(true);
      try {
        const ficheRes = await api.get(`/api/allroute/comptabilite/eleves/${etudiant._id}/fiche`, {
          params: { anneeScolaire: anneeActive },
        });
        setFiche(ficheRes.data.fiche);

        const baremeRes = await api.get("/api/allroute/comptabilite/baremes", {
          params: { anneeScolaire: anneeActive },
        });
        const baremes = baremeRes.data.baremes || [];
        setTousBaremes(baremes);

        const classeEtudiant = normaliserClasse(
          ficheRes.data.fiche?.etudiant?.classe ||
          etudiant.classe ||
          etudiant.derniereClasse
        );

        // ✅ Match UNIQUEMENT sur la bonne année
        let found = baremes.find(
          (b) =>
            normaliserClasse(b.classe) === classeEtudiant &&
            b.anneeScolaire === anneeActive
        );
        if (!found) found = baremes.find((b) => b.anneeScolaire === anneeActive);
        setBareme(found || null);
      } catch (err) {
        showNotification("error", err.response?.data?.message || "Impossible de charger la fiche");
      } finally {
        setLoadingFiche(false);
      }
    };
    fetchAll();
  }, [etudiant?._id, anneeActive]);

  // ==================== POSTES (calcul local) ====================
  const postes = useMemo(() => {
    const paiements = fiche?.paiements || [];

    if (!bareme) {
      const vide = (label, type, numero) => ({
        type, label, numero,
        montantAttendu: 0, montantPaye: 0, reste: 0, statut: "impaye", vide: true,
      });
      return {
        inscription: vide("Inscription", "Inscription"),
        scolarite: [1, 2, 3].map((n) => vide(`Tranche ${n}`, "Scolarité", n)),
        tenue: vide("Tenue", "Tenue"),
      };
    }

    // Inscription
    const fraisInscription = Number(bareme.fraisInscription) || 0;
    const inscriptionPayee = paiements
      .filter((p) => p.typePaiement === "Inscription")
      .reduce((s, p) => s + Number(p.montant || 0), 0);
    const inscriptionReste = Math.max(0, fraisInscription - inscriptionPayee);
    const inscription = {
      type: "Inscription",
      label: "Inscription",
      montantAttendu: fraisInscription,
      montantPaye: inscriptionPayee,
      reste: inscriptionReste,
      statut: fraisInscription === 0 ? "vide" : inscriptionPayee >= fraisInscription ? "paye" : inscriptionPayee > 0 ? "partiel" : "impaye",
      vide: fraisInscription === 0,
    };

    // Scolarité
    const fraisScolarite = Number(bareme.fraisScolarite) || 0;
    const montantsTranches = repartirTranches(fraisScolarite);
    const scolarite = [1, 2, 3].map((numero, idx) => {
      const attendu = montantsTranches[idx];
      const paid = paiements
        .filter((p) => Number(p.trimestre) === numero && p.typePaiement === "Scolarité")
        .reduce((s, p) => s + Number(p.montant || 0), 0);
      const reste = Math.max(0, attendu - paid);
      return {
        numero, type: "Scolarité", label: `Tranche ${numero}`,
        montantAttendu: attendu, montantPaye: paid, reste,
        statut: attendu > 0 && paid >= attendu ? "paye" : paid > 0 ? "partiel" : "impaye",
        vide: attendu === 0,
      };
    });

    // Tenue
    const fraisTenue = Number(bareme.fraisTenue) || 0;
    const tenuePayee = paiements
      .filter((p) => p.typePaiement === "Tenue")
      .reduce((s, p) => s + Number(p.montant || 0), 0);
    const tenueReste = Math.max(0, fraisTenue - tenuePayee);
    const tenue = {
      type: "Tenue",
      label: "Tenue",
      montantAttendu: fraisTenue,
      montantPaye: tenuePayee,
      reste: tenueReste,
      statut: fraisTenue === 0 ? "vide" : tenuePayee >= fraisTenue ? "paye" : tenuePayee > 0 ? "partiel" : "impaye",
      vide: fraisTenue === 0,
    };

    return { inscription, scolarite, tenue };
  }, [bareme, fiche]);

  const resteGlobal = fiche?.resteAPayer ?? initialReste ?? 0;

  const afficherInscription = !postes.inscription.vide;
  const afficherTenue = !postes.tenue.vide;
  const tranchesNonVides = postes.scolarite.filter((t) => !t.vide);
  const afficherScolarite = tranchesNonVides.length > 0;
  const aucunPosteDefini = !afficherInscription && !afficherTenue && !afficherScolarite;

  // ==================== HANDLERS ====================
  const handleSelectEtudiant = (e) => {
    setEtudiant(e);
    setFiche(null);
    setBareme(null);
    setConfirmDialog(null);
  };

  const handleSelectTranche = (poste) => {
    if (poste.statut === "paye") {
      showNotification("info", `${poste.label} déjà totalement payé(e)`);
      return;
    }
    if (poste.vide || poste.reste <= 0) {
      showNotification("error", "Montant non défini");
      return;
    }
    setConfirmDialog({ poste });
    setConfirmMontant(String(poste.reste));
    setConfirmDate(new Date().toLocaleDateString("fr-CA"));
    setConfirmCommentaire("");
    setConfirmModePaiement("Espèces");
  };

  const handleConfirmTranche = async () => {
    if (!confirmDialog?.poste || !etudiant) return;
    const poste = confirmDialog.poste;
    const needsComment = confirmModePaiement === "Autre paiement";

    if (!confirmMontant || Number(confirmMontant) <= 0) {
      showNotification("error", "Montant invalide");
      return;
    }
    if (Number(confirmMontant) > poste.reste) {
      showNotification("error", `Le montant ne peut pas dépasser le reste (${formatGNF(poste.reste)})`);
      return;
    }
    if (needsComment && (!confirmCommentaire || confirmCommentaire.trim().length < 3)) {
      showNotification("error", "Le commentaire est obligatoire (min. 3 caractères)");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Utilise la classe de l'INSCRIPTION pour l'année, pas `derniereClasse`
      const payload = {
        etudiant: etudiant._id,
        typePaiement: poste.type,
        montant: Math.round(Number(confirmMontant)),
        modePaiement: confirmModePaiement,
        classe: fiche?.etudiant?.classe || etudiant.classe || etudiant.derniereClasse || "",
        niveau: fiche?.etudiant?.niveau || etudiant.niveau || etudiant.dernierNiveau || "",
        option: fiche?.etudiant?.option || etudiant.option || etudiant.derniereOption || "",
        anneeScolaire: anneeActive,   // ✅ année imposée
        datePaiement: confirmDate,
        commentaire: confirmCommentaire || `Paiement ${poste.label}`,
      };
      if (poste.type === "Scolarité") payload.trimestre = poste.numero;

      const res = await api.post("/api/allroute/comptabilite/paiements", payload);
      showNotification("success", res.data.message || `${poste.label} enregistré !`);
      setConfirmDialog(null);
      setTimeout(() => onSuccess?.(), 800);
    } catch (error) {
      console.error("❌ Erreur paiement:", error);
      showNotification("error", error.response?.data?.message || "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTrancheCard = (poste, smallLabel) => {
    const styles = {
      paye:    { bg: "bg-gradient-to-br from-emerald-500 to-green-600", border: "border-emerald-600", icon: <Check size={22} />, label: "Payé" },
      partiel: { bg: "bg-gradient-to-br from-amber-400 to-orange-500",  border: "border-amber-600",   icon: <TrendingUp size={22} />, label: "Partiel" },
      impaye:  { bg: "bg-gradient-to-br from-red-500 to-rose-600",      border: "border-red-600",     icon: <XCircle size={22} />, label: "Impayé" },
      vide:    { bg: "bg-gradient-to-br from-gray-400 to-gray-500",     border: "border-gray-500",    icon: <Info size={22} />, label: "À définir" },
    };
    const s = styles[poste.statut] || styles.vide;
    const isPaid = poste.statut === "paye" || poste.vide;
    return (
      <button
        key={smallLabel}
        type="button"
        onClick={() => handleSelectTranche(poste)}
        disabled={isPaid}
        className={`relative p-4 rounded-2xl border-2 transition-all text-left text-white ${s.bg} ${s.border} shadow-lg ${
          isPaid ? "opacity-90 cursor-not-allowed" : "cursor-pointer hover:scale-[1.03] hover:shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/85">{smallLabel}</span>
          <div className="p-1.5 bg-white/25 rounded-lg">{s.icon}</div>
        </div>
        <p className="text-2xl font-extrabold mb-1">{poste.vide ? "À définir" : formatGNF(poste.montantAttendu)}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="px-2 py-0.5 rounded-full bg-white/25 font-semibold">{s.label}</span>
          {poste.statut === "partiel" && <span className="text-white/90 font-medium">Reste : {formatGNF(poste.reste)}</span>}
        </div>
        {isPaid && <div className="absolute top-2 right-2"><Lock size={14} className="text-white/80" /></div>}
      </button>
    );
  };

  const filteredEtudiants = etudiants.filter((e) => {
    const t = searchTerm.toLowerCase();
    return (
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.classe?.toLowerCase().includes(t)
    );
  });

  const resteApresPaiement = confirmDialog?.poste
    ? Math.max(0, confirmDialog.poste.reste - (Number(confirmMontant) || 0))
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification((s) => ({ ...s, show: false }))}
        />
      )}

      {/* CONFIRMATION */}
      {confirmDialog?.poste && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex items-center gap-3 text-white">
              <div className="p-2.5 bg-white/20 rounded-xl"><AlertTriangle size={24} /></div>
              <div>
                <h3 className="text-lg font-bold">Paiement - {confirmDialog.poste.label}</h3>
                <p className="text-xs opacity-90">Année scolaire : {anneeActive}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border-2 border-emerald-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">{confirmDialog.poste.label.toUpperCase()} — RESTE</p>
                    <p className="text-2xl font-extrabold text-emerald-700">{formatGNF(confirmDialog.poste.reste)}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{etudiant?.nomComplet}</p>
                    <p className="font-mono">{etudiant?.matricule}</p>
                    <p className="mt-1 text-indigo-600 font-semibold">{anneeActive}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <DollarSign size={14} className="text-emerald-600" />
                  Montant à payer (GNF) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={confirmMontant}
                    onChange={(e) => setConfirmMontant(e.target.value)}
                    min="0"
                    max={confirmDialog.poste.reste}
                    required
                    className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmMontant(String(confirmDialog.poste.reste))}
                    className="px-3 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm whitespace-nowrap hover:from-emerald-600 hover:to-green-700 shadow-lg flex items-center gap-1"
                  >
                    <Check size={16} /> Tout
                  </button>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-emerald-600 font-semibold">💰 {formatGNF(Number(confirmMontant) || 0)}</span>
                  <span className={`font-semibold ${resteApresPaiement === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {resteApresPaiement === 0 ? "✅ Poste complet" : `Reste après : ${formatGNF(resteApresPaiement)}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES_PAIEMENT.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => {
                        setConfirmModePaiement(m.label);
                        if (!m.needsComment) setConfirmCommentaire("");
                      }}
                      className={`p-3 rounded-xl font-semibold border-2 transition flex items-center justify-center gap-2 text-sm ${
                        confirmModePaiement === m.label
                          ? m.label === "Autre paiement"
                            ? "bg-purple-500 text-white border-purple-500 shadow-lg"
                            : "bg-emerald-500 text-white border-emerald-500 shadow-lg"
                          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} /> Date
                </label>
                <input
                  type="date"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <FileText size={14} /> Commentaire
                  {confirmModePaiement === "Autre paiement" ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={confirmCommentaire}
                  onChange={(e) => setConfirmCommentaire(e.target.value)}
                  placeholder={confirmModePaiement === "Autre paiement" ? "Précisez..." : `Ex: Paiement ${confirmDialog.poste.label}...`}
                  required={confirmModePaiement === "Autre paiement"}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 focus:outline-none ${
                    confirmModePaiement === "Autre paiement"
                      ? "border-purple-300 focus:ring-purple-500 focus:border-purple-500"
                      : "border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  }`}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmTranche}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {submitting ? <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</> : <><Check size={16} /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-2xl"><Banknote size={26} /></div>
            <div>
              <h2 className="text-xl font-bold">Nouveau paiement</h2>
              <p className="text-sm opacity-90">{etudiant?.nomComplet || "Sélectionnez un étudiant"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30">
            <X size={20} />
          </button>
        </div>

        {/* ✅ Bannière année active */}
        <div className="bg-indigo-50 border-b-2 border-indigo-200 px-6 py-3 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-800">
            Année scolaire active : <span className="font-bold">{anneeActive || "Non définie"}</span>
          </span>
          {propAnneeScolaire && (
            <span className="ml-auto text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full font-semibold">
              🔒 Imposée par le filtre
            </span>
          )}
        </div>

        <div className="p-6 space-y-5">
          {!initialEtudiant && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User size={18} className="text-indigo-600" />
                <h3 className="font-bold text-gray-800">1. Choisir un étudiant</h3>
              </div>

              {!etudiant ? (
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, matricule, classe..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {loadingEtudiants ? (
                    <div className="p-6 text-center text-gray-500">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                      Chargement...
                    </div>
                  ) : filteredEtudiants.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 text-sm">Aucun étudiant trouvé.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredEtudiants.map((e) => (
                        <button
                          key={e._id}
                          type="button"
                          onClick={() => handleSelectEtudiant(e)}
                          className="flex items-center gap-3 w-full p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-left"
                        >
                          {e.photo ? (
                            <img src={`http://localhost:4999${e.photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                              {e.prenom?.[0]}{e.nom?.[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                            <div className="text-xs text-gray-500">
                              {e.matricule} · {e.classe || e.derniereClasse || "Classe inconnue"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-300">
                  {etudiant.photo ? (
                    <img src={`http://localhost:4999${etudiant.photo}`} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                      {etudiant.prenom?.[0]}{etudiant.nom?.[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{etudiant.nomComplet}</div>
                    <div className="text-xs text-gray-500">
                      {etudiant.matricule} · {fiche?.etudiant?.classe || etudiant.classe || etudiant.derniereClasse || "-"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEtudiant(null)}
                    className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {etudiant && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 border-2 border-red-200">
              <p className="text-xs text-gray-600 font-semibold mb-1">RESTE À PAYER — {anneeActive}</p>
              <p className="text-2xl font-bold text-red-600">{formatGNF(resteGlobal)}</p>
            </div>
          )}

          {etudiant && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={18} className="text-indigo-600" />
                <h3 className="font-bold text-gray-800">2. Choisir un poste à payer</h3>
              </div>

              {loadingFiche ? (
                <div className="p-6 text-center text-gray-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Chargement du barème...
                </div>
              ) : (
                <>
                  {!bareme && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>Aucun barème pour cette classe en <strong>{anneeActive}</strong>. Configurez-le d'abord.</span>
                    </div>
                  )}

                  {aucunPosteDefini && (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <Info size={32} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-700 font-semibold">Aucun frais configuré</p>
                      <p className="text-gray-500 text-sm">
                        {tousBaremes.length === 0
                          ? `Aucun barème pour ${anneeActive}.`
                          : "Ce barème ne contient aucun montant."}
                      </p>
                    </div>
                  )}

                  {(afficherInscription || afficherTenue) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {afficherInscription && renderTrancheCard(postes.inscription, "Inscription")}
                      {afficherTenue && renderTrancheCard(postes.tenue, "Tenue")}
                    </div>
                  )}

                  {afficherScolarite && (
                    <>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 mt-4">
                        Scolarité ({tranchesNonVides.length} tranche{tranchesNonVides.length > 1 ? "s" : ""})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {tranchesNonVides.map((t) => renderTrancheCard(t, `Tranche ${t.numero}`))}
                      </div>
                    </>
                  )}

                  {!aucunPosteDefini && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      💡 Cliquez sur un poste pour payer <strong>le total ou partiellement</strong>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-100"
          >
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-scale-in { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default AddPaiement;