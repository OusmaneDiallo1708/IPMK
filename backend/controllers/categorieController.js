const mongoose = require('mongoose')
const categorieModel = require('../models/categorieModel')
const ObjectID = require('mongoose').Types.ObjectId

module.exports.addCategories = async (req, res) => {
    const { nom, description } = req.body;
    try {
      const categorie = await categorieModel.create({ nom, description });
      res.status(200).json({
        message: `${nom} a été ajouté avec succès`,
        categorie: categorie
      });
    } catch (error) {
      res.status(400).json({
        message: "Erreur lors de l'ajout de la catégorie",
        erreur: error.message
      });
    }
}

module.exports.getAllCategories = async (req,res)=>{
    try {
        const categorie = await categorieModel.find()
        res.status(200).json({message:'Voici la liste Total', categorie: categorie})
    } catch (error) {
        res.status(400).json({message:'Erreur lors de la recuperation', error: error.message})
    }
}

module.exports.getUnCateroies = async (req,res)=>{
    const categorieId = req.params.id
    // ✅ Correction : vérifier si l'ID est valide
    if (!ObjectID.isValid(categorieId)) {
        return res.status(400).json({ message: "ID invalide" });
    }
    try {
        const categorie = await categorieModel.findById(categorieId)
        if (!categorie) {
            return res.status(404).json({ message: "Catégorie introuvable" });
        }
        res.status(200).json({
            message: `${categorie.nom} a été récupéré avec succès`,
            categorie: categorie
        })
    } catch (error) {
        res.status(400).json({message:'Erreur lors de la récupération', error: error.message})
    }
}

module.exports.updateCategories = async (req,res)=>{
    const categorieId = req.params.id
    // ✅ Correction : vérifier si l'ID est valide
    if (!ObjectID.isValid(categorieId)) {
        return res.status(400).json({ message: "ID invalide" });
    }
    try {
        const categorie = await categorieModel.findOneAndUpdate(
            { _id: categorieId },
            { $set: {
                nom: req.body.nom,
                description: req.body.description
            }},
            { new: true, runValidators: true }
        )
        if (!categorie) {
            return res.status(404).json({ message: "Catégorie introuvable" });
        }
        res.status(200).json({
            message: `${categorie.nom} a été modifié avec succès`,
            categorie: categorie
        })
    } catch (error) {
        res.status(400).json({message:'Erreur lors de la modification', error: error.message})
    }
}

module.exports.deleteCategories = async (req, res) => {
    const categorieId = req.params.id;
  
    // Vérifier si l'ID est valide
    if (!ObjectID.isValid(categorieId)) {
      return res.status(400).json({ message: "ID invalide" });
    }
  
    try {
      const categorie = await categorieModel.findByIdAndDelete(categorieId);
  
      if (!categorie) {
        return res.status(404).json({ message: "Catégorie introuvable" });
      }
  
      res.status(200).json({
        message: `${categorie.nom} a été supprimée avec succès`,
        categorie: categorie
      });
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la suppression",
        error: error.message
      });
    }
};