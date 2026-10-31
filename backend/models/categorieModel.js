const mongoose = require('mongoose')

const categorieSchema = new mongoose.Schema({
    nom:{
        type:String,
        required: true,  // ✅ corrigé: require → required
        trim:true,
        maxlength:100
    },
    description:{
        type:String,
        required: true,  // ✅ corrigé: require → required
        trim:true,
        maxlength:300
    }
},
{
    timestamps:true
}
)

// ✅ Utilise "Categorie" avec majuscule pour cohérence avec le populate
module.exports = mongoose.model('Categorie', categorieSchema)