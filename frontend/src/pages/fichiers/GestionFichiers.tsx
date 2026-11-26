// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import {
  Upload, FileSpreadsheet, FileText, Presentation, File as FileIcon,
  Trash2, Lock, Unlock, UserCheck, Clock, Eye, KeyRound, RefreshCw
} from 'lucide-react';
import api from '../../config/axiosConfig';
import { useUser } from '../../components/log/context/UserContext';

// ============================================================
// 🎨 HELPERS
// ============================================================
const getIcon = (ext = '') => {
  ext = ext.toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="text-green-600" size={28} />;
  if (['docx', 'doc'].includes(ext))        return <FileText className="text-blue-600" size={28} />;
  if (['pptx', 'ppt'].includes(ext))        return <Presentation className="text-orange-600" size={28} />;
  if (ext === 'pdf')                        return <FileText className="text-red-600" size={28} />;
  return <FileIcon className="text-gray-600" size={28} />;
};

const humanSize = (b = 0) => {
  if (b < 1024) return b + ' o';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' Ko';
  return (b / (1024 * 1024)).toFixed(1) + ' Mo';
};

// ============================================================
// 🧩 COMPOSANT PRINCIPAL
// ============================================================
export default function GestionFichiers() {
  const { user } = useUser();
  const [fichiers, setFichiers]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [showDemandes, setShowDemandes] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------
  // 📋 Charger la liste
  // ----------------------------------------------------------
  const charger = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/allroute/fichiers');
      setFichiers(data.fichiers || []);
    } catch (e) {
      console.error('❌ Erreur chargement fichiers:', e);
      setError('Impossible de charger les fichiers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  // ----------------------------------------------------------
  // 📤 Upload
  // ----------------------------------------------------------
  const uploader = async (file: File) => {
    setError(''); setSuccess('');
    const fd = new FormData();
    fd.append('fichier', file);
    fd.append('nom', file.name);
    try {
      setUploading(true);
      await api.post('/api/allroute/fichiers/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`✅ "${file.name}" a été ajouté.`);
      await charger();
    } catch (e: any) {
      console.error('❌ Erreur upload:', e);
      setError(e?.response?.data?.message || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // ----------------------------------------------------------
  // ⬇️ Ouvrir / télécharger
  // ----------------------------------------------------------
  const ouvrir = async (f: any) => {
    setError(''); setSuccess('');
    try {
      const res = await api.get(`/api/allroute/fichiers/${f._id}/telecharger`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = f.nomOriginal;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setError('🔒 Ce fichier est protégé. Cliquez sur "Demander l\'accès".');
      } else {
        setError('Erreur lors de l\'ouverture du fichier.');
      }
    }
  };

  // ----------------------------------------------------------
  // 🙋 Demander l'accès
  // ----------------------------------------------------------
  const demanderAcces = async (f: any) => {
    setError(''); setSuccess('');
    const message = prompt(`Message au propriétaire (optionnel) :`);
    if (message === null) return;
    try {
      await api.post(`/api/allroute/fichiers/${f._id}/demander`, { message });
      setSuccess('✅ Demande envoyée au propriétaire.');
      await charger();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la demande.');
    }
  };

  // ----------------------------------------------------------
  // ✅ Traiter une demande (propriétaire)
  // ----------------------------------------------------------
  const traiter = async (f: any, demandeId: string, action: 'approuvee' | 'refusee') => {
    setError(''); setSuccess('');
    try {
      await api.put(`/api/allroute/fichiers/${f._id}/demande/${demandeId}`, { action });
      setSuccess(action === 'approuvee' ? '✅ Accès accordé.' : '❌ Demande refusée.');
      await charger();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors du traitement.');
    }
  };

  // ----------------------------------------------------------
  // 🗑️ Supprimer
  // ----------------------------------------------------------
  const supprimer = async (f: any) => {
    if (!confirm(`Supprimer définitivement "${f.nom}" ?`)) return;
    try {
      await api.delete(`/api/allroute/fichiers/${f._id}`);
      setSuccess('🗑️ Fichier supprimé.');
      await charger();
    } catch {
      setError('Erreur lors de la suppression.');
    }
  };

  // ============================================================
  // 🎨 RENDER
  // ============================================================
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">

      {/* ============ HEADER + UPLOAD ============ */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">📁 Mes fichiers</h2>
          <p className="text-gray-500 text-sm">
            Excel, Word, PowerPoint ou PDF — visible uniquement par vous, sauf autorisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={charger}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl disabled:opacity-60"
            title="Rafraîchir"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.docx,.doc,.pptx,.ppt,.pdf"
            onChange={e => e.target.files?.[0] && uploader(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow disabled:opacity-60"
          >
            <Upload size={20} />
            {uploading ? 'Envoi en cours...' : 'Ajouter un fichier'}
          </button>
        </div>
      </div>

      {/* ============ MESSAGES ============ */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl">{success}</div>}

      {/* ============ LISTE ============ */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" />
          Chargement...
        </div>
      ) : fichiers.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl">
          <FileIcon size={48} className="text-gray-300 mx-auto mb-3" />
          <p>Aucun fichier pour le moment.</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur « Ajouter un fichier » pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fichiers.map(f => {
            const demandesEnAttente = (f.demandesAcces || []).filter(d => d.statut === 'en_attente');
            const aAcces = f.estProprietaire || f.estAutorise || ['admin', 'superAdmin'].includes(user?.role);
            const demandeUser = f.maDemande;

            return (
              <div key={f._id} className="bg-white rounded-2xl shadow p-4 border border-gray-100">
                {/* --- En-tête du fichier --- */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl">{getIcon(f.extension)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{f.nom}</p>
                    <p className="text-xs text-gray-500">
                      {humanSize(f.taille)} · .{f.extension} · Par <b>{f.proprietaire?.nomComplet || 'Inconnu'}</b>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(f.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {f.estProprietaire
                    ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 shrink-0"><Unlock size={12}/> Mien</span>
                    : f.estAutorise
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 shrink-0"><UserCheck size={12}/> Autorisé</span>
                      : demandeUser?.statut === 'en_attente'
                        ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 shrink-0"><Clock size={12}/> En attente</span>
                        : demandeUser?.statut === 'refusee'
                          ? <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 shrink-0"><Lock size={12}/> Refusé</span>
                          : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1 shrink-0"><Lock size={12}/> Protégé</span>
                  }
                </div>

                {/* --- Boutons d'action --- */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => ouvrir(f)}
                    disabled={!aAcces && demandeUser?.statut !== 'approuvee'}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm px-3 py-2 rounded-lg"
                  >
                    <Eye size={14}/> Ouvrir
                  </button>

                  {!aAcces && demandeUser?.statut !== 'en_attente' && demandeUser?.statut !== 'approuvee' && (
                    <button
                      onClick={() => demanderAcces(f)}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-2 rounded-lg"
                    >
                      <KeyRound size={14}/> Demander l'accès
                    </button>
                  )}

                  {f.estProprietaire && demandesEnAttente.length > 0 && (
                    <button
                      onClick={() => setShowDemandes(showDemandes === f._id ? null : f._id)}
                      className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-lg"
                    >
                      <UserCheck size={14}/> Demandes ({demandesEnAttente.length})
                    </button>
                  )}

                  {(f.estProprietaire || ['admin','superAdmin'].includes(user?.role)) && (
                    <button
                      onClick={() => supprimer(f)}
                      className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-2 rounded-lg"
                    >
                      <Trash2 size={14}/> Supprimer
                    </button>
                  )}
                </div>

                {/* --- Panneau des demandes (propriétaire) --- */}
                {showDemandes === f._id && (
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-800">
                      Demandes d'accès en attente :
                    </p>
                    {demandesEnAttente.length === 0 ? (
                      <p className="text-xs text-gray-500">Aucune demande en attente.</p>
                    ) : (
                      demandesEnAttente.map(d => (
                        <div key={d._id} className="bg-white rounded-lg p-2 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.demandeur?.nomComplet || 'Utilisateur'}</p>
                            {d.message && <p className="text-xs text-gray-500 italic truncate">"{d.message}"</p>}
                          </div>
                          <button
                            onClick={() => traiter(f, d._id, 'approuvee')}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded shrink-0"
                          >Accepter</button>
                          <button
                            onClick={() => traiter(f, d._id, 'refusee')}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded shrink-0"
                          >Refuser</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}