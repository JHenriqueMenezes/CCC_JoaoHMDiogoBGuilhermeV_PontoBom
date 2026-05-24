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
const pedidoRoutes = require('./routes/pedido.routes');
const { asaasWebhook } = require('./controllers/webhook.controller');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook Asaas — sem autenticação, Asaas envia POST server-to-server
app.post('/webhooks/asaas', asaasWebhook);

app.use('/auth', authRoutes);
app.use('/cardapio', cardapioRoutes);
app.use('/admin', adminRoutes);
app.use('/pedidos', pedidoRoutes);

module.exports = app;
