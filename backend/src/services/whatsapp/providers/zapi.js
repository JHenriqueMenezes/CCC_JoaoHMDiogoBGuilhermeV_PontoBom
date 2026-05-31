// Provedor: Z-API (https://z-api.io)
// Documentação: https://developer.z-api.io

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const TOKEN = process.env.ZAPI_TOKEN;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;
const BASE_URL = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`;

const { obterTemplate, aplicar } = require('../templates');

async function enviarMensagem(telefone, mensagem) {
  const numeroFormatado = telefone.replace(/\D/g, '');

  const headers = { 'Content-Type': 'application/json' };
  if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

  const response = await fetch(`${BASE_URL}/send-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone: numeroFormatado, message: mensagem }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Z-API erro: ${erro}`);
  }

  return response.json();
}

async function enviarCodigoVerificacao(telefone, codigo) {
  const tpl = await obterTemplate('codigo_verificacao');
  return enviarMensagem(telefone, aplicar(tpl, { codigo }));
}

async function enviarConfirmacaoPedido(telefone, pedido) {
  const itens = pedido.itens
    .map((i) => `• ${i.quantidade}x ${i.nome} — R$ ${Number(i.precoUnit).toFixed(2)}`)
    .join('\n');
  const formaPagamento = pedido.formaPagamento === 'AVISTA' ? 'À vista na retirada' : 'Online (Asaas)';
  const tpl = await obterTemplate('pedido_confirmado');
  return enviarMensagem(telefone, aplicar(tpl, {
    numero: pedido.numero,
    itens,
    total: Number(pedido.total).toFixed(2),
    formaPagamento,
  }));
}

async function enviarAtualizacaoStatus(telefone, numeroPedido, status, estimativaMin) {
  const chaveMap = {
    ACEITO: 'status_aceito',
    EM_PREPARO: 'status_em_preparo',
    PRONTO_PARA_RETIRADA: 'status_pronto',
    FINALIZADO: 'status_finalizado',
  };
  const chave = chaveMap[status];
  if (!chave) return;
  const tpl = await obterTemplate(chave);
  return enviarMensagem(telefone, aplicar(tpl, {
    numero: numeroPedido,
    estimativa: estimativaMin || null,
  }));
}

async function enviarRecusaPedido(telefone, numeroPedido, motivo) {
  const tpl = await obterTemplate('pedido_recusado');
  return enviarMensagem(telefone, aplicar(tpl, { numero: numeroPedido, motivo }));
}

module.exports = {
  enviarCodigoVerificacao,
  enviarConfirmacaoPedido,
  enviarAtualizacaoStatus,
  enviarRecusaPedido,
};
