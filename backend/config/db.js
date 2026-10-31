const mongoose = require('mongoose');

const ConnexionDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        
        // Vérifier si MONGO_URL existe
        if (!process.env.MONGO_URL) {
            throw new Error('MONGO_URL non définie dans les variables d\'environnement');
        }
        
        await mongoose.connect(process.env.MONGO_URL, {
            // Options recommandées pour éviter les warnings
            serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
        });
        
        console.log('✅ MongoDB connecté avec succès');
    } catch (error) {
        console.error('❌ Échec de connexion à MongoDB:', error.message);
        // Ne pas exit le process ici, laisser l'application gérer l'erreur
        throw error; // Propager l'erreur pour que le serveur ne démarre pas
    }
};

module.exports = ConnexionDB;