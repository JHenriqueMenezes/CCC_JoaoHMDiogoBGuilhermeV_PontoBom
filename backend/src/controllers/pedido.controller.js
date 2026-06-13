const pedidoService = require('../services/pedido.service');

// ── Endpoints do cliente ──────────────────────────────────────────────────────

async function criarPedido(req, res) {
  const usuarioId = req.usuario.id;

  try {
    const resultado = await pedidoService.criarPedido(usuarioId, req.body);
    res.status(201).json(resultado);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ erro: err.message });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar pedido.' });
  }
}

async function consultarPagamentoPedido(req, res) {
  const { numero } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const resultado = await pedidoService.consultarPagamentoPedido(numero, usuarioId);

    if (!resultado) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    if (resultado.statusAtual === undefined) return res.json({ status: resultado.status });

    res.json({ status: resultado.status, statusPedido: resultado.statusAtual });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar pagamento.' });
  }
}

async function meusPedidos(req, res) {
  const usuarioId = req.usuario.id;

  try {
    const pedidos = await pedidoService.meusPedidos(usuarioId);
    res.json({ pedidos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
}

async function detalharPedido(req, res) {
  const { numero } = req.params;
  const usuarioId = req.usuario.id;
  const isAdmin = req.usuario.role === 'ADMIN';

  try {
    const pedido = await pedidoService.detalharPedido(numero, usuarioId, isAdmin);

    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

    res.json({ pedido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar pedido.' });
  }
}

// ── Endpoints do admin ────────────────────────────────────────────────────────

async function listarPedidosAdmin(req, res) {
  const { status } = req.query;

  const statusValidos = ['RECEBIDO', 'ACEITO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA', 'FINALIZADO', 'RECUSADO'];

  if (status && !statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  try {
    const pedidos = await pedidoService.listarPedidosAdmin({ status });
    res.json({ pedidos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar pedidos.' });
  }
}

async function metricas(req, res) {
  try {
    const resultado = await pedidoService.metricas();
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao calcular métricas.' });
  }
}

async function aceitarPedido(req, res) {
  const id = Number(req.params.id);
  const { estimativaMin } = req.body;

  if (!estimativaMin || Number(estimativaMin) <= 0) {
    return res.status(400).json({ erro: 'Informe a estimativa em minutos.' });
  }

  try {
    const pedido = await pedidoService.aceitarPedido(id, estimativaMin);
    res.json({ pedido });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ erro: err.message });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao aceitar pedido.' });
  }
}

async function recusarPedido(req, res) {
  const id = Number(req.params.id);
  const { motivo } = req.body;

  if (!motivo?.trim()) {
    return res.status(400).json({ erro: 'Informe o motivo da recusa.' });
  }

  try {
    const pedido = await pedidoService.recusarPedido(id, motivo);
    res.json({ pedido });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ erro: err.message });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao recusar pedido.' });
  }
}

async function atualizarStatusPedido(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!status) return res.status(400).json({ erro: 'Informe o novo status.' });

  try {
    const pedido = await pedidoService.atualizarStatusPedido(id, status);
    res.json({ pedido });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ erro: err.message });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
}

async function historicoAdmin(req, res) {
  const { status, periodo, busca, pagina } = req.query;

  try {
    const resultado = await pedidoService.historicoAdmin({ status, periodo, busca, pagina });
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar histórico.' });
  }
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
