// Provedor: Z-API (https://z-api.io)
// Documentação: https://developer.z-api.io

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const TOKEN = process.env.ZAPI_TOKEN;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;
const BASE_URL = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`;

async function enviarMensagem(telefone, mensagem) {
  // Z-API espera o número no formato: 5554999999999 (sem + e sem espaços)
  const numeroFormatado = telefone.replace(/\D/g, '');

  const headers = { 'Content-Type': 'application/json' };
  if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

  const response = await fetch(`${BASE_URL}/send-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone: numeroFormatado,
      message: mensagem,
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Z-API erro: ${erro}`);
  }

  return response.json();
}

async function enviarCodigoVerificacao(telefone, codigo) {
  const mensagem = `🔐 *PontoBom* — Seu código de verificação é: *${codigo}*\n\nEste código expira em 10 minutos. Não compartilhe com ninguém.`;
  return enviarMensagem(telefone, mensagem);
}

async function enviarConfirmacaoPedido(telefone, pedido) {
  const itens = pedido.itens
    .map((i) => `• ${i.quantidade}x ${i.nome} — R$ ${Number(i.precoUnit).toFixed(2)}`)
    .join('\n');

  const mensagem =
    `✅ *Pedido Confirmado — PontoBom*\n\n` +
    `📋 Pedido #${pedido.numero}\n\n` +
    `${itens}\n\n` +
    `💰 Total: R$ ${Number(pedido.total).toFixed(2)}\n` +
    `💳 Pagamento: ${pedido.formaPagamento === 'AVISTA' ? 'À vista na retirada' : 'Online (Asaas)'}\n\n` +
    `Acompanhe o status do seu pedido pelo site.`;

  return enviarMensagem(telefone, mensagem);
}

async function enviarAtualizacaoStatus(telefone, numeroPedido, status, estimativaMin) {
  const statusTexto = {
    ACEITO: '✅ Aceito — estamos preparando seu pedido!',
    EM_PREPARO: '👨‍🍳 Em preparo',
    PRONTO_PARA_RETIRADA: '🎉 Pronto para retirada! Pode vir buscar.',
    RECUSADO: '❌ Recusado',
    FINALIZADO: '✔️ Finalizado',
  };

  let mensagem =
    `📦 *PontoBom — Pedido #${numeroPedido}*\n\n` +
    `Status: ${statusTexto[status] || status}`;

  if (estimativaMin) {
    mensagem += `\n⏱️ Tempo estimado: ${estimativaMin} minutos`;
  }

  return enviarMensagem(telefone, mensagem);
}

async function enviarRecusaPedido(telefone, numeroPedido, motivo) {
  const mensagem =
    `❌ *PontoBom — Pedido #${numeroPedido} Recusado*\n\n` +
    `Motivo: ${motivo}\n\n` +
    `Pedimos desculpas pelo inconveniente. Entre em contato conosco para mais informações.`;

  return enviarMensagem(telefone, mensagem);
}

module.exports = {
  enviarCodigoVerificacao,
  enviarConfirmacaoPedido,
  enviarAtualizacaoStatus,
  enviarRecusaPedido,
};
