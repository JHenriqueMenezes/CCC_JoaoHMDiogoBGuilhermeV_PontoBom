const prisma = require('../lib/prisma');

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;
if (!ASAAS_WEBHOOK_TOKEN) {
  console.warn('⚠️  ASAAS_WEBHOOK_TOKEN não definido — webhook do Asaas aceitará requisições sem validação de token.');
}

async function asaasWebhook(req, res) {
  if (ASAAS_WEBHOOK_TOKEN && req.headers['asaas-access-token'] !== ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }

  // Always respond 200 quickly so Asaas doesn't retry
  res.status(200).json({ ok: true });

  const { event, payment } = req.body;
  if (!payment?.externalReference) return;

  const numeroPedido = payment.externalReference;
  const paidEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];

  if (!paidEvents.includes(event)) return;

  try {
    const pedido = await prisma.pedido.findFirst({ where: { numero: numeroPedido } });
    if (!pedido || pedido.statusAtual !== 'RECEBIDO') return;

    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        statusAtual: 'ACEITO',
        historico: {
          create: { status: 'ACEITO', motivo: 'Pagamento confirmado via Asaas' },
        },
      },
    });
  } catch (e) {
    console.error('Webhook Asaas error:', e.message);
  }
}

module.exports = { asaasWebhook };
