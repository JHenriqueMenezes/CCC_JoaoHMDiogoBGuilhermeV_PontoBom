const prisma = require('../lib/prisma');
const whatsapp = require('../services/whatsapp');
const asaas = require('../services/asaas');

async function criarPedido(req, res) {
  const usuarioId = req.usuario.id;
  const { formaPagamento = 'AVISTA', metodoPagamento, itens, cartao, titular } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ erro: 'O pedido deve ter pelo menos um item.' });
  }

  if (formaPagamento === 'ASAAS' && !metodoPagamento) {
    return res.status(400).json({ erro: 'Informe o método de pagamento online (PIX ou CARTAO).' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { telefone: true, nome: true },
    });

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
        itens: { include: { item: { select: { nome: true } } } },
      },
    });

    let pagamentoInfo = null;

    if (formaPagamento === 'ASAAS') {
      try {
        const cliente = await asaas.criarCliente({
          nome: usuario?.nome,
          telefone: usuario?.telefone,
        });

        if (metodoPagamento === 'PIX') {
          const pagamento = await asaas.criarCobrancaPix(cliente.id, total, numero);
          const qrCode = await asaas.buscarPixQrCode(pagamento.id);

          await prisma.pedido.update({
            where: { id: pedido.id },
            data: { asaasPaymentId: pagamento.id },
          });

          pagamentoInfo = {
            tipo: 'PIX',
            paymentId: pagamento.id,
            pixQrCode: qrCode.encodedImage,
            pixCopiaECola: qrCode.payload,
          };
        } else if (metodoPagamento === 'CARTAO') {
          const pagamento = await asaas.criarCobrancaCartao(
            cliente.id,
            total,
            numero,
            cartao,
            { ...titular, telefone: usuario?.telefone },
          );

          await prisma.pedido.update({
            where: { id: pedido.id },
            data: { asaasPaymentId: pagamento.id },
          });

          pagamentoInfo = {
            tipo: 'CARTAO',
            paymentId: pagamento.id,
            status: pagamento.status,
          };
        }
      } catch (e) {
        await prisma.itemPedido.deleteMany({ where: { pedidoId: pedido.id } });
        await prisma.historicoStatus.deleteMany({ where: { pedidoId: pedido.id } });
        await prisma.pedido.delete({ where: { id: pedido.id } });
        const msg = e.data?.errors?.[0]?.description || e.message || 'Erro no pagamento.';
        return res.status(400).json({ erro: msg });
      }
    }

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
      pagamento: pagamentoInfo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar pedido.' });
  }
}

async function consultarPagamentoPedido(req, res) {
  const { numero } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const pedido = await prisma.pedido.findFirst({
      where: { numero, usuarioId },
      select: { asaasPaymentId: true, statusAtual: true },
    });

    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    if (!pedido.asaasPaymentId) return res.json({ status: 'N/A' });

    const pagamento = await asaas.consultarPagamento(pedido.asaasPaymentId);
    res.json({ status: pagamento.status, statusPedido: pedido.statusAtual });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar pagamento.' });
  }
}

module.exports = { criarPedido, consultarPagamentoPedido };
