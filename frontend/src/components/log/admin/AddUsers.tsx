// @ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Lock, Phone, Eye, EyeOff, Upload, List, UserPlus, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import ListUsers from './ListUsers';

// =======================
// 📌 Configuration API URL (locale ou production)
// =======================
const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_APP_URL || 
  (import.meta.env.DEV ? 'http://localhost:4999' : 'https://touramancy2026.onrender.com');

console.log('🔧 API_BASE_URL =', API_BASE_URL); // Vérifie dans la console du navigateur

interface NotificationProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
}

interface UserData {
  nomComplet: string;
  email: string;
  motDePasse: string;
  confirmeMotDePasse: string;
  genre: string;
  telephone: string;
  role: string;
  photo: File | null;
}

interface Errors {
  nomComplet: string;
  email: string;
  motDePasse: string;
  confirmeMotDePasse: string;
  telephone: string;
}

const AddUsers: React.FC = () => {
  const [view, setView] = useState<string>('form');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<UserData>({
    nomComplet: '',
    email: '',
    motDePasse: '',
    confirmeMotDePasse: '',
    genre: '',
    telephone: '',
    role: 'visiteur',
    photo: null
  });
  
  const [errors, setErrors] = useState<Errors>({
    nomComplet: '',
    email: '',
    motDePasse: '',
    confirmeMotDePasse: '',
    telephone: ''
  });

  // Notifications
  const SuccessNotification: React.FC<NotificationProps> = ({ message, onClose }) => (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-white/30 flex items-center space-x-3 max-w-md">
        <CheckCircle className="h-6 w-6 text-white flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Succès!</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
    </div>
  );

  const ErrorNotification: React.FC<NotificationProps> = ({ message, onClose }) => (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-white/30 flex items-center space-x-3 max-w-md">
        <AlertCircle className="h-6 w-6 text-white flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Erreur</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
    </div>
  );

  const WarningNotification: React.FC<NotificationProps> = ({ message, onClose }) => (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-white/30 flex items-center space-x-3 max-w-md">
        <Clock className="h-6 w-6 text-white flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Attention!</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
    </div>
  );

  const fetchUtilisateurs = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/utilisateur/getAllUtilisateurs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUtilisateurs(response.data.utilisateur || []);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      setUtilisateurs([]);
    }
  };

  useEffect(() => {
    if (view === 'list') fetchUtilisateurs();
  }, [view]);

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === 'photo' && files) {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
      if (name === 'email' && value && !validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Email invalide' }));
      } else if (name === 'email') {
        setErrors(prev => ({ ...prev, email: '' }));
      }
      if (name === 'motDePasse' || name === 'confirmeMotDePasse') {
        setErrors(prev => ({ ...prev, confirmeMotDePasse: '' }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {
      nomComplet: '',
      email: '',
      motDePasse: '',
      confirmeMotDePasse: '',
      telephone: ''
    };
    let isValid = true;

    if (!formData.nomComplet) { newErrors.nomComplet = 'Le nom complet est requis'; isValid = false; }
    if (!formData.email) { newErrors.email = 'L\'email est requis'; isValid = false; }
    else if (!validateEmail(formData.email)) { newErrors.email = 'Email invalide'; isValid = false; }
    if (!formData.motDePasse) { newErrors.motDePasse = 'Le mot de passe est requis'; isValid = false; }
    else if (formData.motDePasse.length < 6) { newErrors.motDePasse = 'Au moins 6 caractères'; isValid = false; }
    
    if (!formData.confirmeMotDePasse) { newErrors.confirmeMotDePasse = 'Veuillez confirmer le mot de passe'; isValid = false; }
    else if (formData.motDePasse !== formData.confirmeMotDePasse) { newErrors.confirmeMotDePasse = 'Les mots de passe ne correspondent pas'; isValid = false; }
    
    if (formData.telephone && !/^[0-9+\s()-]{10,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro invalide';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const showNotification = (type: string, message: string): void => {
    if (type === 'success') { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 5000); }
    else if (type === 'warning') { setWarningMessage(message); setShowWarning(true); setTimeout(() => setShowWarning(false), 8000); }
    else { setErrorMessage(message); setShowError(true); setTimeout(() => setShowError(false), 5000); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nomComplet', formData.nomComplet);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('motDePasse', formData.motDePasse);
      formDataToSend.append('genre', formData.genre);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('role', formData.role);
      if (formData.photo) formDataToSend.append('photo', formData.photo);

      const apiUrl = `${API_BASE_URL}/api/utilisateur/ajoutUtilisateur`;
      const token = localStorage.getItem('token');

      const response = await axios.post(apiUrl, formDataToSend, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        withCredentials: true
      });

      if (response.data.message && (response.data.message.includes('attente') || response.data.message.includes('activation'))) {
        showNotification('warning', '✅ Utilisateur créé! En attente d\'activation par l\'administrateur.');
      } else {
        showNotification('success', response.data.message || 'Utilisateur ajouté avec succès!');
      }
      
      setFormData({
        nomComplet: '',
        email: '',
        motDePasse: '',
        confirmeMotDePasse: '',
        genre: '',
        telephone: '',
        role: 'visiteur',
        photo: null
      });
      const fileInput = document.getElementById('photo-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchUtilisateurs();

    } catch (error: any) {
      console.error("Erreur ajout:", error);
      if (error.response?.status === 400) showNotification('error', error.response.data.message || "Données invalides.");
      else if (error.response?.status === 401) showNotification('error', "Non authentifié. Reconnectez-vous.");
      else if (error.response?.status === 403) showNotification('warning', error.response.data.message || "Droits insuffisants.");
      else if (error.response?.status === 409) showNotification('error', "Cet email est déjà utilisé.");
      else if (error.response?.status === 500) showNotification('error', "Erreur serveur.");
      else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') showNotification('error', "Erreur de connexion au serveur. Vérifiez que le backend est démarré.");
      else showNotification('error', error.response?.data?.message || "Une erreur inattendue s'est produite.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-3">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600">Les nouveaux comptes doivent être activés par l'administrateur</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="flex justify-center p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex space-x-3 bg-white p-2 rounded-2xl shadow-inner">
              <button onClick={() => setView('form')} className={`flex items-center px-6 py-3 rounded-xl transition-all ${view === 'form' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                <UserPlus size={20} className="mr-2" /> Ajouter un utilisateur
              </button>
              <button onClick={() => setView('list')} className={`flex items-center px-6 py-3 rounded-xl transition-all ${view === 'list' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                <List size={20} className="mr-2" /> Liste des utilisateurs
              </button>
            </div>
          </div>

          {showSuccess && <SuccessNotification message="Utilisateur ajouté avec succès!" onClose={() => setShowSuccess(false)} />}
          {showError && <ErrorNotification message={errorMessage} onClose={() => setShowError(false)} />}
          {showWarning && <WarningNotification message={warningMessage} onClose={() => setShowWarning(false)} />}

          <div className="p-8">
            {view === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    <p className="text-sm text-yellow-700">
                      ⚠️ Les nouveaux comptes sont créés en mode <strong>« en attente d'activation »</strong>. 
                      Un administrateur doit activer le compte avant que l'utilisateur puisse se connecter.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Nom complet */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-blue-400" /></div>
                      <input type="text" name="nomComplet" value={formData.nomComplet} onChange={handleChange}
                        className={`pl-12 w-full rounded-xl border-2 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all ${errors.nomComplet ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Nom et prénom" />
                    </div>
                    {errors.nomComplet && <p className="text-red-500 text-sm flex items-center mt-1"><AlertCircle className="h-4 w-4 mr-1" /> {errors.nomComplet}</p>}
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-blue-400" /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        className={`pl-12 w-full rounded-xl border-2 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="adresse@exemple.com" />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm"><AlertCircle className="h-4 w-4 inline mr-1" /> {errors.email}</p>}
                  </div>
                  
                  {/* Mot de passe */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-blue-400" /></div>
                      <input type={showPassword ? "text" : "password"} name="motDePasse" value={formData.motDePasse} onChange={handleChange}
                        className={`pl-12 pr-12 w-full rounded-xl border-2 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100 ${errors.motDePasse ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="******** (min. 6 caractères)" />
                      <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.motDePasse && <p className="text-red-500 text-sm"><AlertCircle className="h-4 w-4 inline mr-1" /> {errors.motDePasse}</p>}
                  </div>
                  
                  {/* Confirmation mot de passe */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-blue-400" /></div>
                      <input type={showPassword ? "text" : "password"} name="confirmeMotDePasse" value={formData.confirmeMotDePasse} onChange={handleChange}
                        className={`pl-12 w-full rounded-xl border-2 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100 ${errors.confirmeMotDePasse ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Répétez le mot de passe" />
                    </div>
                    {errors.confirmeMotDePasse && <p className="text-red-500 text-sm"><AlertCircle className="h-4 w-4 inline mr-1" /> {errors.confirmeMotDePasse}</p>}
                  </div>
                  
                  {/* Téléphone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-blue-400" /></div>
                      <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange}
                        className={`pl-12 w-full rounded-xl border-2 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100 ${errors.telephone ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="0123456789" />
                    </div>
                    {errors.telephone && <p className="text-red-500 text-sm"><AlertCircle className="h-4 w-4 inline mr-1" /> {errors.telephone}</p>}
                  </div>
                  
                  {/* Genre */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Genre</label>
                    <select name="genre" value={formData.genre} onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100">
                      <option value="">Sélectionnez un genre</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                  
                  {/* ✅ Rôle — LISTE MISE À JOUR */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
                    <select name="role" value={formData.role} onChange={handleChange}
                      className="w-full rounded-xl border-2 border-gray-200 py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-100">
                      <option value="visiteur">Visiteur</option>
                      <option value="Etudiant">Étudiant</option>
                      {/* <option value="Enseignant">Enseignant</option> */}
                      <option value="Tuteur">Tuteur</option>
                      <option value="Comptable">Comptable</option>
                      <option value="admin">Administrateur</option>
                      <option value="superAdmin">Super Admin</option>
                    </select>
                    <p className="text-xs text-gray-400">⚠️ Seul un administrateur peut activer ce compte</p>
                  </div>
                  
                  {/* Photo */}
                  {/* <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Photo de profil</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-500" />
                          <p className="mb-2 text-sm text-gray-500 group-hover:text-blue-600"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                          <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 5MB)</p>
                        </div>
                        <input type="file" name="photo" id="photo-input" onChange={handleChange} className="hidden" accept="image/*" />
                      </label>
                    </div>
                    {formData.photo && <p className="text-sm text-blue-600 flex items-center mt-2"><CheckCircle className="h-4 w-4 mr-1" /> Fichier: {formData.photo.name}</p>}
                  </div> */}
                </div>
                
                <div className="flex justify-center pt-6">
                  <button type="submit" disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2">
                    {isLoading ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Ajout en cours...</span></>
                    ) : (
                      <><UserPlus className="h-5 w-5" /><span>Inscrire</span></>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-2xl shadow-inner overflow-hidden">
                <div className="overflow-x-auto"><ListUsers/></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default AddUsers;