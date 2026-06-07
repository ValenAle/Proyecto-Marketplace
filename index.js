require('dotenv').config();
const path       = require('path');
const express    = require('express');
const cors       = require('cors');
const authRoutes = require('./src/routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
].filter(Boolean);

/* ─────────────────────────────────────────
   Middlewares globales
───────────────────────────────────────── */
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────────────────
   API
───────────────────────────────────────── */
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'FIVOX API corriendo 🚀' });
});

/* ─────────────────────────────────────────
   Frontend estático
───────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, message: 'Ruta no encontrada.' });
  }
  res.status(404).send('Página no encontrada.');
});

/* ─────────────────────────────────────────
   Iniciar servidor
───────────────────────────────────────── */
require('./src/config/db');

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
