const bcrypt = require('bcrypt');
const utilisateurModel = require('./models/utilisateurModel');

const createDefaultAdmin = async () => {
    try {
        // Vérifier si l'admin existe déjà
        let admin = await utilisateurModel.findOne({ email: "ousmanedev@gmail.com" });
        
        if (!admin) {
            // Hacher le mot de passe
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("666958074", salt);
            
            // Créer l'admin par défaut
            admin = new utilisateurModel({
                nomComplet: "Ousmane Diallo",
                email: "ousmanedev@gmail.com",
                motDePasse: hashedPassword,
                telephone: "666958074",
                genre: "Homme",
                role: "superAdmin",
                actif: true,
                dateInscription: new Date(),
                dateActivation: new Date()
            });
            
            await admin.save();
            console.log("✅ Super Admin créé avec succès!");
            console.log("📧 Email: ousmanedev@gmail.com");
            console.log("🔑 Mot de passe: 666958074");
            console.log("👑 Rôle: superAdmin");
        } else {
            // S'assurer que l'admin existant est actif
            if (!admin.actif) {
                admin.actif = true;
                await admin.save();
                console.log("✅ Admin existant activé!");
            } else {
                console.log("✅ Super Admin déjà présent et actif");
            }
        }
        
        return admin;
        
    } catch (error) {
        console.error("❌ Erreur lors de la création/activation de l'admin:", error.message);
    }
};

module.exports = createDefaultAdmin;