const prisma = require('../lib/prisma');
const whatsapp = require('../services/whatsapp');

async function criarPedido(req, res) {
  const usuarioId = req.usuario.id;
  const { formaPagamento = 'AVISTA', itens } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ erro: 'O pedido deve ter pelo menos um item.' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { telefone: true, nome: true },
    });

    // Número sequencial simples
    const count = await prisma.pedido.count();
    const numero = String(count + 1).padStart(4, '0');

    const total = itens.reduce((s, i) => s + i.precoUnit * i.quantidade, 0);

    const pedido = await prisma.pedido.create({
      data: {
        numero,
        usuarioId,
        formaPagamento,
        statusAtual: 'RECEBIDO',
        total,
        itens: {
          create: itens.map((i) => ({
            itemId: i.itemId,
            quantidade: i.quantidade,
            observacao: i.observacao || null,
            precoUnit: i.precoUnit,
          })),
        },
        historico: {
          create: { status: 'RECEBIDO' },
        },
      },
      include: {
        itens: {
          include: { item: { select: { nome: true } } },
        },
      },
    });

    // Confirmação via WhatsApp
    if (usuario?.telefone) {
      try {
        await whatsapp.enviarConfirmacaoPedido(usuario.telefone, {
          numero: pedido.numero,
          total: pedido.total,
          formaPagamento: pedido.formaPagamento,
          itens: pedido.itens.map((i) => ({
            nome: i.item.nome,
            quantidade: i.quantidade,
            precoUnit: i.precoUnit,
          })),
        });
      } catch (e) {
        console.warn('WhatsApp não enviado:', e.message);
      }
    }

    res.status(201).json({
      pedido: {
        id: pedido.id,
        numero: pedido.numero,
        status: pedido.statusAtual,
        total: Number(pedido.total),
        formaPagamento: pedido.formaPagamento,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar pedido.' });
  }
}

module.exports = { criarPedido };
