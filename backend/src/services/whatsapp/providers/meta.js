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
// O template 'hello_world' já vem aprovado por padrão para testes
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
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Meta API erro ao enviar template: ${erro}`);
  }

  return response.json();
}

// NOTA: Para usar OTP com a API da Meta, é necessário criar e aprovar
// um template de mensagem do tipo "AUTHENTICATION" no Meta Business Manager.
// Enquanto o template não for aprovado, use enviarMensagem dentro da janela de 24h.
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
