// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Users, RefreshCw, List, Search, X, CheckCircle, XCircle,
  AlertTriangle, Edit, Trash2, Eye, UserPlus, RotateCw, BookOpen,
  Save, AlertCircle, Info, User, Phone, MapPin, ShieldCheck, IdCard,
  Upload, Image as ImageIcon
} from "lucide-react";
import api from "../../config/axiosConfig";
import AddEtudiants from "./AddEtudiants";
import Inscription from "./Inscription";
import Reinscription from "./Reinscription";

// ==================== NOTIFICATION ÉLÉGANTE ====================
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

// ==================== CHAMP RÉUTILISABLE ====================
const Field = ({ label, value, onChange, readOnly, type = "text", placeholder = "" }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {readOnly ? (
      <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 min-h-[42px]">
        {value || <span className="text-gray-400">-</span>}
      </div>
    ) : (
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
      />
    )}
  </div>
);

// ==================== MODAL VOIR / MODIFIER ====================
const StudentModal = ({ student, mode, onClose, onSave, onNotify }) => {
  const [formData, setFormData] = useState({
    ina: student?.ina || "",
    matricule: student?.matricule || "",
    nom: student?.nom || "",
    prenom: student?.prenom || "",
    telephone: student?.contacts?.telephone || "",
    email: student?.contacts?.email || "",
    adresse: student?.contacts?.adresse || student?.adresse || "",
    contacts_titre_nom: student?.contacts_titre?.nom || "",
    contacts_titre_telephone: student?.contacts_titre?.telephone || "",
    photo: null,                                   // ✅ AJOUT : nouvelle photo
  });

  // ✅ AJOUT : aperçu de la photo
  const [photoPreview, setPhotoPreview] = useState(
    student?.photo ? `http://localhost:4999${student.photo}` : null
  );
  const fileInputRef = useRef(null);               // ✅ AJOUT

  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ AJOUT : gestion du changement de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onNotify("error", "Veuillez sélectionner une image valide");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onNotify("error", "L'image ne doit pas dépasser 5 MB");
      return;
    }

    setFormData(prev => ({ ...prev, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ✅ AJOUT : supprimer la photo choisie
  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(student?.photo ? `http://localhost:4999${student.photo}` : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!formData.nom?.trim() || !formData.prenom?.trim()) {
      onNotify("error", "Le nom et le prénom sont obligatoires");
      return;
    }

    if (!formData.ina?.trim()) {
      onNotify("error", "L'INA est obligatoire");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("ina", formData.ina.trim());
      fd.append("nom", formData.nom.trim());
      fd.append("prenom", formData.prenom.trim());
      fd.append("matricule", formData.matricule?.trim() || "");
      fd.append("genre", student?.genre || "Homme");

      fd.append(
        "contacts",
        JSON.stringify({
          telephone: formData.telephone?.trim() || null,
          email: formData.email?.trim() || null,
          adresse: formData.adresse?.trim() || null,
        })
      );

      fd.append(
        "contacts_titre",
        JSON.stringify({
          nom: formData.contacts_titre_nom?.trim() || null,
          telephone: formData.contacts_titre_telephone?.trim() || null,
        })
      );

      // ✅ AJOUT : envoi de la nouvelle photo
      if (formData.photo) {
        fd.append("photo", formData.photo);
      }

      await api.put(`/api/allroute/etudiant/${student._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onNotify("success", "Étudiant modifié avec succès ✨");
      onSave();
    } catch (err) {
      onNotify("error", err.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const readOnly = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${readOnly ? "from-blue-600 to-indigo-700" : "from-emerald-600 to-green-700"} p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-2xl">
              {readOnly ? <Eye size={22} /> : <Edit size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {readOnly ? "Détails de l'étudiant" : "Modifier l'étudiant"}
              </h2>
              <p className="text-xs opacity-90 font-mono">
                {student?.ina ? `${student.ina} · ` : ""}{student?.matricule}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Photo + Nom */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            {/* ✅ MODIFIÉ : aperçu photo cliquable en mode édition */}
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {student?.prenom?.[0]}{student?.nom?.[0]}
                </div>
              )}

              {/* ✅ AJOUT : bouton modifier photo (uniquement en édition) */}
              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition"
                    title="Changer la photo"
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800">{student?.nomComplet}</h3>
              <p className="text-sm text-gray-500">{student?.genre}</p>

              {/* ✅ AJOUT : info photo sélectionnée + bouton retirer */}
              {!readOnly && formData.photo && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <ImageIcon size={12} /> {formData.photo.name}
                  </span>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="text-xs text-red-500 hover:text-red-600 underline"
                  >
                    Retirer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ===== IDENTITÉ ===== */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-blue-500" />
                Identité
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field
                label="INA *"
                value={formData.ina}
                readOnly={readOnly}
                placeholder="Identifiant unique"
                onChange={(v) => handleChange("ina", v)}
              />
              <Field
                label="Matricule"
                value={formData.matricule}
                readOnly={readOnly}
                placeholder="Auto si vide"
                onChange={(v) => handleChange("matricule", v)}
              />
              <Field
                label="Nom *"
                value={formData.nom}
                readOnly={readOnly}
                placeholder="Diallo"
                onChange={(v) => handleChange("nom", v)}
              />
              <Field
                label="Prénom *"
                value={formData.prenom}
                readOnly={readOnly}
                placeholder="Ousmane"
                onChange={(v) => handleChange("prenom", v)}
              />
            </div>
          </div>

          {/* ===== COORDONNÉES ===== */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Phone size={18} className="text-emerald-500" />
                Coordonnées
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Téléphone (optionnel)"
                value={formData.telephone}
                readOnly={readOnly}
                placeholder="+224 600 00 00 00"
                onChange={(v) => handleChange("telephone", v)}
              />
              <Field
                label="Email (optionnel)"
                value={formData.email}
                readOnly={readOnly}
                type="email"
                placeholder="etudiant@gmail.com"
                onChange={(v) => handleChange("email", v)}
              />
              <div className="md:col-span-2">
                <Field
                  label="Adresse"
                  value={formData.adresse}
                  readOnly={readOnly}
                  placeholder="Conakry, Guinée"
                  onChange={(v) => handleChange("adresse", v)}
                />
              </div>
            </div>
          </div>

          {/* ===== CONTACT DU TITULAIRE ===== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-500" />
                Contact du titulaire
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nom du responsable"
                value={formData.contacts_titre_nom}
                readOnly={readOnly}
                placeholder="Ex: Mamadou Diallo"
                onChange={(v) => handleChange("contacts_titre_nom", v)}
              />
              <Field
                label="Téléphone du responsable"
                value={formData.contacts_titre_telephone}
                readOnly={readOnly}
                placeholder="+224 620 00 00 00"
                onChange={(v) => handleChange("contacts_titre_telephone", v)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition">
            {readOnly ? "Fermer" : "Annuler"}
          </button>
          {!readOnly && (
            <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg flex items-center gap-2 disabled:opacity-50 transition">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL CONFIRMATION SUPPRESSION ====================
const ConfirmDelete = ({ student, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={40} className="text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
        <p className="text-gray-600 text-sm">
          Voulez-vous vraiment supprimer <span className="font-semibold text-gray-800">{student?.nomComplet}</span> ?
          <br />Cette action est irréversible.
        </p>
      </div>
      <div className="p-4 bg-gray-50 border-t flex gap-3">
        <button onClick={onClose} disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition">
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {loading ? "Suppression..." : "Supprimer"}
        </button>
      </div>
    </div>
  </div>
);

// ==================== COMPOSANT PRINCIPAL ====================
const ListeEtudiants = () => {
  const [formType, setFormType] = useState(null);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "success", message: "" });

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showNotification = (type, message) =>
    setNotification({ show: true, type, message });

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

  // Suppression
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/allroute/etudiant/${deleteTarget._id}`);
      showNotification("success", `${deleteTarget.nomComplet} a été supprimé(e) avec succès`);
      setDeleteTarget(null);
      fetchEtudiants();
    } catch (error) {
      showNotification("error", error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Filtre — recherche aussi par INA
  const filteredEtudiants = etudiants.filter(e => {
    const t = searchTerm.toLowerCase();
    return (
      e.nomComplet?.toLowerCase().includes(t) ||
      e.matricule?.toLowerCase().includes(t) ||
      e.ina?.toLowerCase().includes(t) ||
      e.contacts?.email?.toLowerCase().includes(t)
    );
  });

  // ==================== STATUT ====================
  const renderStatut = (e) => {
    if (e.inscrit) {
      const isReinscrit = e.nombreInscriptions > 1;

      if (isReinscrit) {
        return (
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1 w-fit">
              <RotateCw size={12} /> Réinscrit
            </span>
            {e.anneeInscriptionActuelle && (
              <span className="text-xs text-gray-500 font-medium">
                📅 {e.anneeInscriptionActuelle}
              </span>
            )}
            <span className="text-xs text-purple-500 font-medium">
              {e.nombreInscriptions} inscriptions
            </span>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-1">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1 w-fit">
            <CheckCircle size={12} /> Inscrit
          </span>
          {e.anneeInscriptionActuelle && (
            <span className="text-xs text-gray-500 font-medium">
              📅 {e.anneeInscriptionActuelle}
            </span>
          )}
        </div>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
        <AlertTriangle size={12} /> Non inscrit
      </span>
    );
  };

  const renderClasse = (e) => {
    if (e.derniereClasse) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-gray-800">{e.derniereClasse}</span>
          {e.dernierNiveau && <span className="text-xs text-gray-500">{e.dernierNiveau}</span>}
          {e.derniereOption && <span className="text-xs text-gray-400">{e.derniereOption}</span>}
        </div>
      );
    }
    return <span className="text-sm text-gray-500">-</span>;
  };

  const renderListe = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <List size={22} className="text-blue-600" />
          Liste des étudiants
          <span className="ml-2 text-sm font-normal bg-white text-gray-600 px-3 py-1 rounded-full">
            {filteredEtudiants.length} étudiant(s)
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher par INA, matricule, nom..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 w-72" />
          </div>
          <button onClick={fetchEtudiants}
            className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition" title="Rafraîchir">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-3" size={32} /> Chargement...
        </div>
      ) : filteredEtudiants.length === 0 ? (
        <div className="p-16 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun étudiant trouvé</h3>
          <p className="text-gray-500">Commencez par ajouter un étudiant.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">INA</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Matricule</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Nom complet</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Téléphone</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Classe / Niveau</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEtudiants.map((e) => (
                <tr key={e._id} className="border-b hover:bg-blue-50/40 transition">
                  <td className="p-4 font-mono text-sm font-semibold text-purple-700">{e.ina || "-"}</td>
                  <td className="p-4 font-mono text-sm font-semibold text-blue-700">{e.matricule}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {e.photo ? (
                        <img src={`http://localhost:4999${e.photo}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {e.prenom?.[0]}{e.nom?.[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-800">{e.nomComplet}</div>
                        <div className="text-xs text-gray-500">{e.genre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-700">{e.contacts?.email || "-"}</td>
                  <td className="p-4 text-sm text-gray-700">{e.contacts?.telephone || "-"}</td>
                  <td className="p-4">{renderClasse(e)}</td>
                  <td className="p-4">{renderStatut(e)}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setSelectedStudent(e); setModalMode("view"); }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Voir">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { setSelectedStudent(e); setModalMode("edit"); }}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="Modifier">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(e)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(s => ({ ...s, show: false }))}
        />
      )}

      {selectedStudent && modalMode && (
        <StudentModal
          student={selectedStudent}
          mode={modalMode}
          onClose={() => { setSelectedStudent(null); setModalMode(null); }}
          onSave={() => { setSelectedStudent(null); setModalMode(null); fetchEtudiants(); }}
          onNotify={showNotification}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          student={deleteTarget}
          loading={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* ===== 4 BOUTONS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button onClick={() => setFormType("ajout")}
          className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
            formType === "ajout"
              ? "bg-gradient-to-r from-blue-700 to-blue-900 scale-105"
              : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
          }`}>
          <div className="p-3 bg-white/20 rounded-xl"><UserPlus size={24} /></div>
          <div className="text-left">
            <div className="text-lg">Ajouter</div>
            <div className="text-xs font-normal opacity-90">Nouvel étudiant</div>
          </div>
        </button>

        <button onClick={() => setFormType("inscription")}
          className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
            formType === "inscription"
              ? "bg-gradient-to-r from-emerald-700 to-emerald-900 scale-105"
              : "bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800"
          }`}>
          <div className="p-3 bg-white/20 rounded-xl"><BookOpen size={24} /></div>
          <div className="text-left">
            <div className="text-lg">Inscrire</div>
            <div className="text-xs font-normal opacity-90">Étudiant existant</div>
          </div>
        </button>

        <button onClick={() => setFormType("reinscription")}
          className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
            formType === "reinscription"
              ? "bg-gradient-to-r from-purple-700 to-purple-900 scale-105"
              : "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
          }`}>
          <div className="p-3 bg-white/20 rounded-xl"><RotateCw size={24} /></div>
          <div className="text-left">
            <div className="text-lg">Réinscrire</div>
            <div className="text-xs font-normal opacity-90">Déjà inscrit</div>
          </div>
        </button>

        <button onClick={() => { setFormType(null); fetchEtudiants(); }}
          className={`flex items-center gap-3 p-5 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
            formType === null
              ? "bg-gradient-to-r from-amber-700 to-amber-900 scale-105"
              : "bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
          }`}>
          <div className="p-3 bg-white/20 rounded-xl"><List size={24} /></div>
          <div className="text-left">
            <div className="text-lg">Liste</div>
            <div className="text-xs font-normal opacity-90">Tous les étudiants</div>
          </div>
        </button>
      </div>

      {/* ===== FORMULAIRES ===== */}
      {formType === "ajout" && (
        <div className="mb-8">
          <AddEtudiants
            onSuccess={() => { setFormType(null); fetchEtudiants(); }}
            onCancel={() => setFormType(null)}
          />
        </div>
      )}

      {formType === "inscription" && (
        <div className="mb-8">
          <Inscription
            onSuccess={() => { setFormType(null); fetchEtudiants(); }}
            onCancel={() => setFormType(null)}
          />
        </div>
      )}

      {formType === "reinscription" && (
        <div className="mb-8">
          <Reinscription
            onSuccess={() => { setFormType(null); fetchEtudiants(); }}
            onCancel={() => setFormType(null)}
          />
        </div>
      )}

      {/* ===== LISTE ===== */}
      <div className="mt-8">{renderListe()}</div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default ListeEtudiants;