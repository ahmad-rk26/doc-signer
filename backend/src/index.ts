import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import docRoutes from "./routes/docRoutes";
import sigRoutes from "./routes/sigRoutes";
import auditRoutes from "./routes/auditRoutes";
import publicRoutes from "./routes/publicRoutes";

dotenv.config();

const app = express();

/* ================= CORS CONFIG ================= */

const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.FRONTEND_URL_PRODUCTION || "https://doc-signer-lime.vercel.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // allow server-to-server or curl requests
            if (!origin) return callback(null, true);

            // allow defined origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // allow all Vercel preview deployments
            if (origin.endsWith(".vercel.app")) {
                return callback(null, true);
            }

            console.warn("CORS blocked origin:", origin);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= HEALTH ROUTES ================= */

app.get("/", (_, res) => {
    res.send("API Running");
});

app.get("/health", (_, res) => {
    const emailConfigured = !!(
        process.env.EMAIL_USER && process.env.EMAIL_PASS
    );

    const frontendConfigured = !!(
        process.env.FRONTEND_URL ||
        process.env.FRONTEND_URL_PRODUCTION
    );

    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        config: {
            emailConfigured,
            frontendConfigured, // use it here
            emailUser: process.env.EMAIL_USER
                ? `${process.env.EMAIL_USER.substring(0, 3)}***`
                : "NOT SET",
            frontendUrl:
                process.env.FRONTEND_URL ||
                process.env.FRONTEND_URL_PRODUCTION ||
                "NOT SET",
            supabaseConfigured: !!process.env.SUPABASE_URL
        }
    });
});

/* ================= ROUTES ================= */

app.use("/api/docs", docRoutes);
app.use("/api", sigRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/public", publicRoutes);

/* ================= SERVER START ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});