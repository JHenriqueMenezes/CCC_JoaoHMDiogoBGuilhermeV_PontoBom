const prisma = require('../lib/prisma');

async function asaasWebhook(req, res) {
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
