import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import docRoutes from './routes/docRoutes';
import sigRoutes from './routes/sigRoutes';
import auditRoutes from './routes/auditRoutes';
import publicRoutes from './routes/publicRoutes';
dotenv.config();

const app = express();

app.use(cors({ origin: '*' })); // Adjust for production
app.use(express.json());


app.use('/api/docs', docRoutes);
app.use('/api', sigRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/public', publicRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));