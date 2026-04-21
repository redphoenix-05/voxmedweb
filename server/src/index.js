import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import adminHospitalRoutes from './routes/admin/hospitals.js';
import adminDoctorRoutes from './routes/admin/doctors.js';
import adminUserRoutes from './routes/admin/users.js';
import adminRevenueRoutes from './routes/admin/revenue.js';
import hospitalDoctorRoutes from './routes/hospital/doctors.js';
import hospitalTestRoutes from './routes/hospital/tests.js';
import hospitalStaffRoutes from './routes/hospital/staff.js';
import hospitalAppointmentRoutes from './routes/hospital/appointments.js';
import hospitalDashboardRoutes from './routes/hospital/dashboard.js';
import receptionistRoutes from './routes/receptionist.js';
import labRoutes from './routes/lab.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://voxmedweb.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/hospitals', adminHospitalRoutes);
app.use('/api/admin/doctors', adminDoctorRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/revenue', adminRevenueRoutes);
app.use('/api/hospital/doctors', hospitalDoctorRoutes);
app.use('/api/hospital/tests', hospitalTestRoutes);
app.use('/api/hospital/staff', hospitalStaffRoutes);
app.use('/api/hospital/appointments', hospitalAppointmentRoutes);
app.use('/api/hospital/dashboard', hospitalDashboardRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Export app for Vercel serverless runtime
export default app;

// Only start the HTTP server when running locally (not in Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`VoxMed server running on port ${PORT}`);
  });
}
