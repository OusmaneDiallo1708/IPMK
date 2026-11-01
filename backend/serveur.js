// =======================
// 📌 Import des modules
// =======================
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fs = require("fs");

// =======================
// 📌 Import des modules locaux
// =======================
const ConnexionDB = require("./config/db");
const utilisateurRoute = require("./routes/utilisateurRoute");
const allRoute = require("./routes/allRoute");
const { checkUser, requireAuth } = require("./middlewares/authmiddlewear");

// =======================
// 📌 Configuration dotenv
// =======================
const envPath = path.join(__dirname, "config", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("📁 Configuration locale: fichier .env chargé");
} else {
  dotenv.config();
  console.log("☁️ Configuration Render: variables d'environnement utilisées");
}

// =======================
// 📌 Initialisation App (AVANT CORS !)
// =======================
const app = express();

// =======================
// 📌 Middleware de base
// =======================
app.use(express.json());
app.use(cookieParser());

// =======================
// 📌 Configuration CORS (corrigée pour Vercel + Previews)
// =======================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://ipmk.vercel.app",
  process.env.CORS_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Requêtes sans origin (Postman, curl, même-origine) → autorisées
    if (!origin) return callback(null, true);

    // 2. Liste blanche explicite
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 3. Toutes les URLs Vercel du projet (production + previews)
    //    ✅ Accepte : ipmk.vercel.app
    //    ✅ Accepte : ipmk-iexsayks5-...-0ac41000.vercel.app (avec tirets)
    //    ✅ Accepte : ipmk-git-master-team.vercel.app
    //    ❌ Refuse  : autre-projet.vercel.app
    if (/^https:\/\/ipmk[a-z0-9-]*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // 4. Sinon on bloque avec un log clair côté serveur
    console.log(`⚠️ CORS bloqué: ${origin}`);
    return callback(new Error(`CORS non autorisé pour ${origin}`), false);
  },
  credentials: true,
  exposedHeaders: ["sessionId"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// =======================
// 📌 Vérification JWT
// =======================
app.use(checkUser);

// =======================
// 📌 Connexion MongoDB
// =======================
const startDB = async () => {
  try {
    await ConnexionDB();
    console.log("✅ Base de données connectée");
  } catch (error) {
    console.error("❌ Erreur base de données:", error.message);
    process.exit(1);
  }
};
startDB();

// =======================
// 📌 Routes
// =======================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API en ligne",
    status: "en ligne",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      jwtid: "/jwtid",
      utilisateur: "/api/utilisateur",
      produits: "/api/allRoute/getAllProduits",
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/jwtid", requireAuth, (req, res) => {
  res.status(200).json({ userId: res.locals.user._id });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Serveur en ligne",
    timestamp: new Date().toISOString(),
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/utilisateur", utilisateurRoute);
app.use("/api/allRoute", allRoute);

// =======================
// 📌 Route 404
// =======================
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.originalUrl,
  });
});

// =======================
// 📌 Gestion globale des erreurs
// =======================
app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err.message);

  // Erreur CORS → statut 403 explicite
  if (err.message && err.message.startsWith("CORS non autorisé")) {
    return res.status(403).json({
      error: "CORS bloqué",
      message: err.message,
    });
  }

  res.status(500).json({
    error: "Erreur interne du serveur",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// =======================
// 📌 Démarrage Serveur
// =======================
const PORT = process.env.PORT || 4999;

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || "development"}`);
  console.log(`🟢 Health check: http://localhost:${PORT}/health`);
});