const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Servir imagens enviadas pelo admin
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth.routes');
const cardapioRoutes = require('./routes/cardapio.routes');
const adminRoutes = require('./routes/admin.routes');
const pedidoRoutes = require('./routes/pedido.routes');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/cardapio', cardapioRoutes);
app.use('/admin', adminRoutes);
app.use('/pedidos', pedidoRoutes);

module.exports = app;
