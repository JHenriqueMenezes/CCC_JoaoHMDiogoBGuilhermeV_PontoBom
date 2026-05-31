// Provedor: Meta WhatsApp Business API (oficial)
// Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Para ativar, configure no .env:
//   WHATSAPP_PROVIDER=meta
//   META_PHONE_NUMBER_ID=seu_phone_number_id
//   META_ACCESS_TOKEN=seu_access_token
//   META_API_VERSION=v19.0 (opcional)

const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = process.env.META_API_VERSION || 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

const { obterTemplate, aplicar } = require('../templates');

// Envia mensagem de texto livre (só funciona dentro da janela de 24h após o cliente escrever)
async function enviarMensagem(telefone, mensagem) {
  const numeroFormatado = telefone.replace(/\D/g, '');

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: numeroFormatado,
      type: 'text',
      text: { body: mensagem },
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Meta API erro: ${erro}`);
  }

  return response.json();
}

// Envia template aprovado pela Meta (necessário fora da janela de 24h)
async function enviarTemplate(telefone, templateName, languageCode = 'pt_BR', components = []) {
  const numeroFormatado = telefone.replace(/\D/g, '');

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: numeroFormatado,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Meta API erro ao enviar template: ${erro}`);
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
