import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import docRoutes from './routes/docRoutes';
import sigRoutes from './routes/sigRoutes';
import auditRoutes from './routes/auditRoutes';
import publicRoutes from './routes/publicRoutes';
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL_PRODUCTION || 'https://doc-signer-lime.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get("/", (_, res) => {
    res.send("API Running");
});

app.use('/api/docs', docRoutes);
app.use('/api', sigRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/public', publicRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));