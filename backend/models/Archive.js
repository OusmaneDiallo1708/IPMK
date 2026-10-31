const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['vente', 'stock'],
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    montantTotal: {
        type: Number,
        default: 0
    },
    dateArchivage: {
        type: Date,
        default: Date.now
    },
    archivePar: {
        type: String,
        default: 'Caisse'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Archive', archiveSchema);