// Serviço de WhatsApp — seleciona o provedor pela variável WHATSAPP_PROVIDER no .env
// Valores aceitos: 'zapi' (padrão) | 'meta'
//
// Para trocar de provedor, basta alterar no .env:
//   WHATSAPP_PROVIDER=meta

const provedor = process.env.WHATSAPP_PROVIDER || 'zapi';

let whatsapp;

if (provedor === 'meta') {
  whatsapp = require('./providers/meta');
  console.log('📱 WhatsApp: usando API oficial da Meta');
} else {
  whatsapp = require('./providers/zapi');
  console.log('📱 WhatsApp: usando Z-API');
}

module.exports = whatsapp;
