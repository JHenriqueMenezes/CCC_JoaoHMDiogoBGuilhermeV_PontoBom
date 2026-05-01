const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const cardapioRoutes = require('./routes/cardapio.routes');
const adminRoutes = require('./routes/admin.routes');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/cardapio', cardapioRoutes);
app.use('/admin', adminRoutes);

module.exports = app;
