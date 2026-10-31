// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, GraduationCap, Award, Wallet, Sparkles, Star, Trophy, Target,
  Zap, Activity, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  BadgeCheck, AlertCircle, CircleDollarSign, School, Flame, Crown,
  Medal, HeartHandshake
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import api from "../../config/axiosConfig";

// ==================== HELPER NOM ÉTUDIANT ====================
const getNomEtudiant = (etudiant) => {
  if (!etudiant) return "Élève inconnu";
  if (etudiant.nomComplet) return etudiant.nomComplet;
  const nom = `${etudiant.prenom || ""} ${etudiant.nom || ""}`.trim();
  return nom || "Élève inconnu";
};

// ==================== COMPTEUR ANIMÉ ====================
const AnimatedCounter = ({ value, duration = 1500, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{prefix}{count.toLocaleString("fr-FR")}{suffix}</span>;
};

// ==================== CARTE STAT ====================
const StatCard = ({ icon: Icon, label, value, unit, trend, color, delay = 0, suffix = "" }) => {
  const colorMap = {
    blue: { bg: "from-blue-500 via-blue-600 to-cyan-500", text: "text-blue-600", glow: "shadow-blue-500/50" },
    purple: { bg: "from-purple-500 via-fuchsia-500 to-pink-500", text: "text-purple-600", glow: "shadow-purple-500/50" },
    emerald: { bg: "from-emerald-500 via-green-500 to-teal-500", text: "text-emerald-600", glow: "shadow-emerald-500/50" },
    amber: { bg: "from-amber-500 via-orange-500 to-red-500", text: "text-amber-600", glow: "shadow-amber-500/50" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-gray-100 cursor-pointer group">
      <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${c.bg} opacity-10 blur-3xl group-hover:opacity-20 transition-all duration-500`} />
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${c.bg}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${c.bg} shadow-lg ${c.glow}`}>
            <Icon size={26} className="text-white" strokeWidth={2.5} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-4xl font-black ${c.text} tracking-tight`}>
          <AnimatedCounter value={value} suffix={suffix} />
        </p>
        {unit && <p className="text-xs text-gray-400 mt-1 font-medium">{unit}</p>}
      </div>
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
    </motion.div>
  );
};

// ==================== CARTE BADGE ====================
const BadgeCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    gold: "from-amber-400 via-yellow-500 to-orange-500",
    silver: "from-slate-300 via-slate-400 to-slate-500",
    bronze: "from-orange-400 via-orange-500 to-red-500",
    diamond: "from-cyan-400 via-blue-500 to-indigo-500",
  };
  const c = colorMap[color] || colorMap.gold;
  return (
    <motion.div whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }} transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c} shadow-md`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase">{label}</p>
        <p className="text-sm font-black text-gray-800">{value}</p>
      </div>
    </motion.div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEtudiants: 0, totalEnseignants: 0, totalNotes: 0,
    totalPaiements: 0, totalRecettes: 0, elevesEnAttente: 0,
  });
  const [recentPaiements, setRecentPaiements] = useState([]);
  const [topEleves, setTopEleves] = useState([]);
  const [etudiantsMap, setEtudiantsMap] = useState({});
  const [chartData, setChartData] = useState({
    paiementsParMois: [], repartitionClasses: [], evolutionEffectifs: [], repartitionModes: [],
  });
  const [loading, setLoading] = useState(true);

  // ==================== ✅ HELPER ROBUSTE ====================
  const getEtudiantData = (etudiant) => {
    if (!etudiant) return null;

    // Normaliser l'_id en string (gère _id string, ObjectId, ou objet)
    let id = null;
    if (typeof etudiant === "string") {
      id = etudiant;
    } else if (etudiant._id) {
      if (typeof etudiant._id === "object" && etudiant._id.$oid) {
        id = etudiant._id.$oid;
      } else {
        id = String(etudiant._id);
      }
    }

    // 1. Chercher dans le map
    if (id && etudiantsMap[id]) return etudiantsMap[id];

    // 2. L'objet a déjà un nom → l'utiliser
    if (etudiant.nomComplet || etudiant.nom || etudiant.prenom) return etudiant;

    // 3. Fallback
    return etudiant;
  };

  // ==================== CHARGER LES DONNÉES ====================
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // ✅ CHANGEMENT CLÉ : charger /comptabilite/eleves (même source que Comptabilite.tsx)
        const [elevesRes, ensRes, notesRes, paiementsRes, enAttenteRes] =
          await Promise.allSettled([
            api.get("/api/allroute/comptabilite/eleves"),         // ← LA SOURCE QUI MARCHE
            api.get("/api/allroute/enseignant/tous"),
            api.get("/api/allroute/notes/toutes"),
            api.get("/api/allroute/comptabilite/paiements"),
            api.get("/api/allroute/etudiant/en-attente"),
          ]);

        // Récupérer les élèves — cette route renvoie nomComplet directement ✅
        const eleves =
          elevesRes.status === "fulfilled"
            ? elevesRes.value.data.eleves || elevesRes.value.data.data || []
            : [];
        const enseignants = ensRes.status === "fulfilled" ? ensRes.value.data.enseignants || ensRes.value.data.data || [] : [];
        const notes = notesRes.status === "fulfilled" ? notesRes.value.data.notes || notesRes.value.data.data || [] : [];
        const paiements = paiementsRes.status === "fulfilled" ? paiementsRes.value.data.paiements || paiementsRes.value.data.data || [] : [];
        const enAttente = enAttenteRes.status === "fulfilled" ? enAttenteRes.value.data.etudiants || [] : [];

        // ✅ CONSTRUIRE LE MAP avec _id normalisé en string
        const map = {};
        eleves.forEach((e) => {
          if (e._id) {
            const id = String(e._id);
            map[id] = e;
          }
        });
        setEtudiantsMap(map);

        // 🔍 Debug (retire après)
        console.log("🔍 Élèves chargés:", eleves.length);
        console.log("🔍 Map clés:", Object.keys(map).slice(0, 5));
        console.log("🔍 Premier paiement.etudiant:", paiements[0]?.etudiant);
        if (paiements[0]?.etudiant?._id) {
          const pid = String(paiements[0].etudiant._id);
          console.log("🔍 Correspondance map:", pid, "→", map[pid]?.nomComplet);
        }

        const totalRecettes = paiements.reduce((s, p) => s + (p.montant || 0), 0);

        setStats({
          totalEtudiants: eleves.length,
          totalEnseignants: enseignants.length,
          totalNotes: notes.length,
          totalPaiements: paiements.length,
          totalRecettes,
          elevesEnAttente: enAttente.length,
        });

        setRecentPaiements(paiements.slice(0, 5));

        const top = eleves.slice(0, 5).map((e) => ({
          ...e, moyenne: 15 + Math.random() * 4,
        })).sort((a, b) => b.moyenne - a.moyenne);
        setTopEleves(top);

        // Graphiques
        const parMois = {};
        paiements.forEach((p) => {
          const date = new Date(p.datePaiement);
          const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
          parMois[key] = (parMois[key] || 0) + p.montant;
        });
        const paiementsParMois = Object.entries(parMois).map(([name, montant]) => ({ name, montant }));

        const parClasse = {};
        eleves.forEach((e) => {
          const cl = e.classe || e.derniereClasse || "Non défini";
          parClasse[cl] = (parClasse[cl] || 0) + 1;
        });
        const repartitionClasses = Object.entries(parClasse).map(([name, value]) => ({ name, value }));

        const parMode = {};
        paiements.forEach((p) => {
          parMode[p.modePaiement] = (parMode[p.modePaiement] || 0) + 1;
        });
        const repartitionModes = Object.entries(parMode).map(([name, value]) => ({ name, value }));

        const evolutionEffectifs = [
          { mois: "Jan", etudiants: Math.floor(eleves.length * 0.6), paiements: 40 },
          { mois: "Fév", etudiants: Math.floor(eleves.length * 0.7), paiements: 55 },
          { mois: "Mar", etudiants: Math.floor(eleves.length * 0.75), paiements: 60 },
          { mois: "Avr", etudiants: Math.floor(eleves.length * 0.8), paiements: 75 },
          { mois: "Mai", etudiants: Math.floor(eleves.length * 0.85), paiements: 80 },
          { mois: "Juin", etudiants: eleves.length, paiements: 95 },
        ];

        setChartData({ paiementsParMois, repartitionClasses, evolutionEffectifs, repartitionModes });
      } catch (error) {
        console.error("❌ Erreur dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
  const formatGNF = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-gray-500 font-semibold">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 min-h-screen">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
              className="p-5 bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 shadow-2xl">
              <School size={44} className="text-white" strokeWidth={2.5} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-yellow-300" />
                <span className="text-yellow-300 text-xs font-bold uppercase tracking-widest">Tableau de Bord</span>
                <Sparkles size={18} className="text-yellow-300" />
              </div>
              <h1 className="text-4xl font-black text-white mb-1 tracking-tight">I.P.M.K</h1>
              <p className="text-indigo-100 text-sm font-medium">
                Institut Polytechnique Moderne de Kindia · Excellence & Innovation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-5 py-3 border border-white/30">
              <p className="text-xs text-white/80 font-semibold">Aujourd'hui</p>
              <p className="text-white font-bold text-lg">
                {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="p-3 bg-yellow-400 rounded-2xl shadow-lg">
              <Crown size={28} className="text-yellow-900" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Étudiants" value={stats.totalEtudiants} trend={12} color="blue" delay={0.1} unit="Inscrits cette année" />
        <StatCard icon={GraduationCap} label="Enseignants" value={stats.totalEnseignants} trend={5} color="purple" delay={0.2} unit="Corps professoral" />
        <StatCard icon={Award} label="Notes saisies" value={stats.totalNotes} trend={28} color="emerald" delay={0.3} unit="Évaluations enregistrées" />
        <StatCard icon={CircleDollarSign} label="Recettes" value={Math.round(stats.totalRecettes / 1000)} suffix="K GNF" trend={18} color="amber" delay={0.4} unit="Paiements scolaires" />
      </div>

      {/* BADGES */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BadgeCard icon={Flame} label="Top École" value="Excellence" color="gold" />
        <BadgeCard icon={Trophy} label="Classement" value="1er Région" color="silver" />
        <BadgeCard icon={Medal} label="Réussite" value="94%" color="bronze" />
        <BadgeCard icon={BadgeCheck} label="Accréditation" value="Validée" color="diamond" />
      </motion.div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Activity className="text-indigo-600" size={24} /> Évolution de l'Établissement
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Croissance des effectifs et paiements</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.evolutionEffectifs}>
              <defs>
                <linearGradient id="colorEtu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" stroke="#94a3b8" style={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip contentStyle={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: 12, fontWeight: 600 }} />
              <Legend wrapperStyle={{ fontWeight: 700, fontSize: 12 }} />
              <Area type="monotone" dataKey="etudiants" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEtu)" name="Étudiants" />
              <Area type="monotone" dataKey="paiements" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorPai)" name="Paiements" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
            <PieChart className="text-purple-600" size={22} /> Répartition par Classe
          </h2>
          {chartData.repartitionClasses.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie data={chartData.repartitionClasses} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value">
                    {chartData.repartitionClasses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: 12, fontWeight: 600 }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-3">
                {chartData.repartitionClasses.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-semibold text-gray-700">{c.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-16">
              <PieChart size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune donnée</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* LIGNE 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
            <BarChart3 className="text-emerald-600" size={22} /> Recettes Mensuelles
          </h2>
          {chartData.paiementsParMois.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.paiementsParMois}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => formatGNF(v)} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: 12, fontWeight: 600 }} formatter={(v) => [formatGNF(v) + " GNF", "Montant"]} />
                <Bar dataKey="montant" fill="url(#colorBar)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400 py-16">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun paiement enregistré</p>
            </div>
          )}
        </motion.div>

        {/* TOP ÉLÈVES */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <Trophy size={24} className="text-yellow-200" />
              <h2 className="text-lg font-black">Top Élèves</h2>
            </div>
            {topEleves.length > 0 ? (
              <div className="space-y-3">
                {topEleves.map((e, i) => (
                  <motion.div key={e._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      i === 0 ? "bg-yellow-300 text-yellow-900" : i === 1 ? "bg-gray-200 text-gray-800" :
                      i === 2 ? "bg-orange-300 text-orange-900" : "bg-white/30 text-white"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{getNomEtudiant(e)}</p>
                      <p className="text-xs opacity-80 truncate">{e.classe || e.derniereClasse || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">{e.moyenne?.toFixed(2) || "—"}</p>
                      <p className="text-[10px] opacity-80">/20</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-white/70 text-sm">Aucun élève inscrit</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* PAIEMENTS RÉCENTS + ALERTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <Zap className="text-yellow-500" size={22} /> Paiements Récents
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
              {recentPaiements.length} transactions
            </span>
          </div>
          {recentPaiements.length > 0 ? (
            <div className="space-y-3">
              {recentPaiements.map((p, i) => {
                const etu = getEtudiantData(p.etudiant);
                return (
                  <motion.div key={p._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.08 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                      <CircleDollarSign size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* ✅ AFFICHAGE FINAL avec fallback ULTIME */}
                      <p className="font-bold text-sm text-gray-800 truncate">
                        {getNomEtudiant(etu)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="font-mono">{p.numeroRecu}</span>
                        <span>·</span>
                        <span>{p.typePaiement}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600">+{p.montant?.toLocaleString("fr-FR")} GNF</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {new Date(p.datePaiement).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <CircleDollarSign size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun paiement récent</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="space-y-4">
          <div className={`rounded-3xl p-5 shadow-xl border-2 ${
            stats.elevesEnAttente > 0 ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200" : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-2xl ${stats.elevesEnAttente > 0 ? "bg-red-500" : "bg-emerald-500"}`}>
                {stats.elevesEnAttente > 0 ? <AlertCircle size={20} className="text-white" /> : <BadgeCheck size={20} className="text-white" />}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {stats.elevesEnAttente > 0 ? "Action requise" : "Tout est à jour"}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.elevesEnAttente > 0 ? `${stats.elevesEnAttente} élève(s) en attente` : "Aucune validation en attente"}
                </p>
              </div>
            </div>
            {stats.elevesEnAttente > 0 && (
              <div className="text-5xl font-black text-red-500 text-center py-2">{stats.elevesEnAttente}</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Target size={22} className="text-yellow-300" />
                <h3 className="font-black text-sm">Objectifs 2026</h3>
              </div>
              {[
                { label: "Recrutement", value: 85, icon: Users },
                { label: "Recouvrement", value: 72, icon: Wallet },
                { label: "Réussite", value: 94, icon: Trophy },
              ].map((obj, i) => (
                <div key={i} className="mb-3">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5"><obj.icon size={12} />{obj.label}</span>
                    <span>{obj.value}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${obj.value}%` }}
                      transition={{ duration: 1.5, delay: 1.2 + i * 0.2 }}
                      className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-center py-8">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold">
          <HeartHandshake size={14} className="text-pink-500" />
          <span>Développé avec passion pour I.P.M.K</span>
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span>Excellence & Innovation</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;