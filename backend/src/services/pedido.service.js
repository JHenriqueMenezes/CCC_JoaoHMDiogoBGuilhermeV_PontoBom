const prisma = require('../lib/prisma');
const whatsapp = require('./whatsapp');
const asaas = require('./asaas');

// ── Helpers ────────────────────────────────────────────────────────────────

function erroComStatus(status, mensagem) {
  const err = new Error(mensagem);
  err.status = status;
  return err;
}

// ── Helpers de serialização ───────────────────────────────────────────────────

function mapItemPedido(ip) {
  return {
    id: ip.id,
    itemId: ip.itemId,
    nome: ip.item?.nome ?? null,
    imagemUrl: ip.item?.imagemUrl ?? null,
    quantidade: ip.quantidade,
    observacao: ip.observacao ?? null,
    precoUnit: Number(ip.precoUnit),
  };
}

function mapHistorico(h) {
  return {
    id: h.id,
    status: h.status,
    motivo: h.motivo ?? null,
    criadoEm: h.criadoEm,
  };
}

function mapPedidoLista(p) {
  return {
    id: p.id,
    numero: p.numero,
    statusAtual: p.statusAtual,
    formaPagamento: p.formaPagamento,
    total: Number(p.total),
    estimativaMin: p.estimativaMin ?? null,
    criadoEm: p.criadoEm,
    itens: (p.itens ?? []).map(mapItemPedido),
  };
}

function mapPedidoDetalhe(p) {
  return {
    ...mapPedidoLista(p),
    asaasPaymentId: p.asaasPaymentId ?? null,
    usuario: p.usuario
      ? { id: p.usuario.id ?? null, nome: p.usuario.nome ?? null, telefone: p.usuario.telefone ?? null }
      : null,
    historico: (p.historico ?? []).map(mapHistorico),
  };
}

// ── Transições válidas (sequencial) ──────────────────────────────────────────
const PROXIMOS_STATUS = {
  ACEITO: 'EM_PREPARO',
  EM_PREPARO: 'PRONTO_PARA_RETIRADA',
  PRONTO_PARA_RETIRADA: 'FINALIZADO',
};

// ── Endpoints do cliente ──────────────────────────────────────────────────────

async function criarPedido(usuarioId, body) {
  const { formaPagamento = 'AVISTA', metodoPagamento, itens, cartao, titular, cpf } = body;

  if (!itens || itens.length === 0) {
    throw erroComStatus(400, 'O pedido deve ter pelo menos um item.');
  }

  if (formaPagamento === 'ASAAS' && !metodoPagamento) {
    throw erroComStatus(400, 'Informe o método de pagamento online (PIX ou CARTAO).');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { telefone: true, nome: true },
  });

  const count = await prisma.pedido.count();
  const numero = String(count + 1).padStart(4, '0');

  const total = itens.reduce((s, i) => s + i.precoUnit * i.quantidade, 0);

  const dadosPedido = {
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
  };

  const includePedido = {
    itens: { include: { item: { select: { nome: true } } } },
  };

  let pedido;
  let pagamentoInfo = null;

  if (formaPagamento === 'ASAAS') {
    try {
      pedido = await prisma.$transaction(async (tx) => {
        const p = await tx.pedido.create({ data: dadosPedido, include: includePedido });

        const cliente = await asaas.criarCliente({
          nome: usuario?.nome,
          telefone: usuario?.telefone,
          cpf,
        });

        if (metodoPagamento === 'PIX') {
          const pagamento = await asaas.criarCobrancaPix(cliente.id, total, numero);
          const qrCode = await asaas.buscarPixQrCode(pagamento.id);

          await tx.pedido.update({
            where: { id: p.id },
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

          await tx.pedido.update({
            where: { id: p.id },
            data: { asaasPaymentId: pagamento.id },
          });

          pagamentoInfo = {
            tipo: 'CARTAO',
            paymentId: pagamento.id,
            status: pagamento.status,
          };
        }

        return p;
      }, { timeout: 15000 });
    } catch (e) {
      const msg = e.data?.errors?.[0]?.description || e.message || 'Erro no pagamento.';
      throw erroComStatus(400, msg);
    }
  } else {
    pedido = await prisma.pedido.create({ data: dadosPedido, include: includePedido });
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

  return {
    pedido: {
      id: pedido.id,
      numero: pedido.numero,
      status: pedido.statusAtual,
      total: Number(pedido.total),
      formaPagamento: pedido.formaPagamento,
    },
    pagamento: pagamentoInfo,
  };
}

async function consultarPagamentoPedido(numero, usuarioId) {
  const pedido = await prisma.pedido.findFirst({
    where: { numero, usuarioId },
    select: { asaasPaymentId: true, statusAtual: true },
  });

  if (!pedido) return null;
  if (!pedido.asaasPaymentId) return { status: 'N/A' };

  const pagamento = await asaas.consultarPagamento(pedido.asaasPaymentId);
  return { status: pagamento.status, statusAtual: pedido.statusAtual };
}

async function meusPedidos(usuarioId) {
  const pedidos = await prisma.pedido.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: 'desc' },
    include: {
      itens: { include: { item: { select: { nome: true, imagemUrl: true } } } },
      historico: { orderBy: { criadoEm: 'asc' } },
    },
  });

  return pedidos.map(mapPedidoLista);
}

async function detalharPedido(numero, usuarioId, isAdmin) {
  const pedido = await prisma.pedido.findFirst({
    where: {
      numero,
      ...(isAdmin ? {} : { usuarioId }),
    },
    include: {
      usuario: { select: { id: true, nome: true, telefone: true } },
      itens: { include: { item: { select: { nome: true, imagemUrl: true } } } },
      historico: { orderBy: { criadoEm: 'asc' } },
    },
  });

  if (!pedido) return null;

  return mapPedidoDetalhe(pedido);
}

// ── Endpoints do admin ────────────────────────────────────────────────────────

async function listarPedidosAdmin(filtros) {
  const { status } = filtros;

  const pedidos = await prisma.pedido.findMany({
    where: status ? { statusAtual: status } : {},
    orderBy: { criadoEm: 'desc' },
    include: {
      usuario: { select: { id: true, nome: true, telefone: true } },
      itens: { include: { item: { select: { nome: true, imagemUrl: true } } } },
      historico: { orderBy: { criadoEm: 'asc' } },
    },
  });

  return pedidos.map(mapPedidoDetalhe);
}

async function metricas() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const [totalHoje, totalOntem, emProducao, prontos, faturamento] = await Promise.all([
    prisma.pedido.count({ where: { criadoEm: { gte: hoje, lt: amanha } } }),
    prisma.pedido.count({ where: { criadoEm: { gte: ontem, lt: hoje } } }),
    prisma.pedido.count({ where: { statusAtual: { in: ['ACEITO', 'EM_PREPARO'] } } }),
    prisma.pedido.count({ where: { statusAtual: 'PRONTO_PARA_RETIRADA' } }),
    prisma.pedido.aggregate({
      where: { statusAtual: 'FINALIZADO', criadoEm: { gte: hoje, lt: amanha } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const variacaoVsOntem =
    totalOntem > 0 ? Math.round(((totalHoje - totalOntem) / totalOntem) * 100) : null;

  return {
    totalHoje,
    variacaoVsOntem,
    emProducao,
    prontos,
    faturamentoHoje: Number(faturamento._sum.total ?? 0),
    finalizadosHoje: faturamento._count,
  };
}

async function aceitarPedido(id, estimativaMin) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { usuario: { select: { telefone: true } } },
  });

  if (!pedido) throw erroComStatus(404, 'Pedido não encontrado.');
  if (pedido.statusAtual !== 'RECEBIDO') {
    throw erroComStatus(400, 'Apenas pedidos com status RECEBIDO podem ser aceitos.');
  }

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: {
      statusAtual: 'ACEITO',
      estimativaMin: Number(estimativaMin),
      historico: { create: { status: 'ACEITO' } },
    },
  });

  if (pedido.usuario?.telefone) {
    try {
      await whatsapp.enviarAtualizacaoStatus(
        pedido.usuario.telefone,
        pedido.numero,
        'ACEITO',
        Number(estimativaMin),
      );
    } catch (e) {
      console.warn('WhatsApp não enviado:', e.message);
    }
  }

  return {
    id: atualizado.id,
    numero: atualizado.numero,
    status: atualizado.statusAtual,
    estimativaMin: atualizado.estimativaMin,
  };
}

async function recusarPedido(id, motivo) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { usuario: { select: { telefone: true } } },
  });

  if (!pedido) throw erroComStatus(404, 'Pedido não encontrado.');
  if (!['RECEBIDO', 'ACEITO'].includes(pedido.statusAtual)) {
    throw erroComStatus(400, `Pedido no status ${pedido.statusAtual} não pode ser recusado.`);
  }

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: {
      statusAtual: 'RECUSADO',
      historico: { create: { status: 'RECUSADO', motivo: motivo.trim() } },
    },
  });

  if (pedido.usuario?.telefone) {
    try {
      await whatsapp.enviarRecusaPedido(pedido.usuario.telefone, pedido.numero, motivo.trim());
    } catch (e) {
      console.warn('WhatsApp não enviado:', e.message);
    }
  }

  return { id: atualizado.id, numero: atualizado.numero, status: atualizado.statusAtual };
}

async function atualizarStatusPedido(id, status) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { usuario: { select: { telefone: true } } },
  });

  if (!pedido) throw erroComStatus(404, 'Pedido não encontrado.');

  const proximoValido = PROXIMOS_STATUS[pedido.statusAtual];
  if (!proximoValido || proximoValido !== status) {
    throw erroComStatus(
      400,
      `Transição inválida: de ${pedido.statusAtual} só é possível ir para ${proximoValido ?? 'nenhum status'}.`,
    );
  }

  const atualizado = await prisma.pedido.update({
    where: { id },
    data: {
      statusAtual: status,
      historico: { create: { status } },
    },
  });

  if (pedido.usuario?.telefone && ['PRONTO_PARA_RETIRADA', 'FINALIZADO'].includes(status)) {
    try {
      await whatsapp.enviarAtualizacaoStatus(pedido.usuario.telefone, pedido.numero, status, null);
    } catch (e) {
      console.warn('WhatsApp não enviado:', e.message);
    }
  }

  return { id: atualizado.id, numero: atualizado.numero, status: atualizado.statusAtual };
}

async function historicoAdmin(filtros) {
  const { status, periodo = '7d', busca = '', pagina = '1' } = filtros;
  const pg = Math.max(1, Number(pagina));
  const POR_PAGINA = 25;

  const agora = new Date();
  let dataInicio;
  if (periodo === 'hoje') {
    dataInicio = new Date(agora);
    dataInicio.setHours(0, 0, 0, 0);
  } else if (periodo === '7d') {
    dataInicio = new Date(agora);
    dataInicio.setDate(agora.getDate() - 7);
  } else if (periodo === '30d') {
    dataInicio = new Date(agora);
    dataInicio.setDate(agora.getDate() - 30);
  }

  const statusFiltro = status === 'FINALIZADO' || status === 'RECUSADO'
    ? [status]
    : ['FINALIZADO', 'RECUSADO'];

  const where = {
    statusAtual: { in: statusFiltro },
    ...(dataInicio ? { criadoEm: { gte: dataInicio } } : {}),
    ...(busca.trim() ? {
      OR: [
        { numero: { contains: busca.trim(), mode: 'insensitive' } },
        { usuario: { nome: { contains: busca.trim(), mode: 'insensitive' } } },
        { usuario: { telefone: { contains: busca.trim() } } },
      ],
    } : {}),
  };

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (pg - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        usuario: { select: { nome: true, telefone: true } },
        itens: { include: { item: { select: { nome: true } } } },
        historico: { where: { status: 'RECUSADO' }, select: { motivo: true }, take: 1 },
      },
    }),
  ]);

  return {
    pedidos: pedidos.map((p) => ({
      id: p.id,
      numero: p.numero,
      statusAtual: p.statusAtual,
      formaPagamento: p.formaPagamento,
      total: Number(p.total),
      criadoEm: p.criadoEm,
      atualizadoEm: p.atualizadoEm,
      cliente: p.usuario ? { nome: p.usuario.nome, telefone: p.usuario.telefone } : null,
      resumoItens: p.itens.map((i) => ({ nome: i.item?.nome ?? '?', quantidade: i.quantidade, observacao: i.observacao ?? null })),
      motivo: p.historico[0]?.motivo ?? null,
    })),
    total,
    pagina: pg,
    totalPaginas: Math.ceil(total / POR_PAGINA),
  };
}

module.exports = {
  criarPedido,
  consultarPagamentoPedido,
  meusPedidos,
  detalharPedido,
  listarPedidosAdmin,
  metricas,
  aceitarPedido,
  recusarPedido,
  atualizarStatusPedido,
  historicoAdmin,
};
