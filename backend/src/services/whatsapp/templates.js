const prisma = require('../../lib/prisma');

const FALLBACKS = {
  codigo_verificacao:
    '🔐 *PontoBom* — Seu código de verificação é: *{{codigo}}*\n\nEste código expira em 10 minutos. Não compartilhe com ninguém.',
  pedido_confirmado:
    '✅ *Pedido Confirmado — PontoBom*\n\n📋 Pedido #{{numero}}\n\n{{itens}}\n\n💰 Total: R$ {{total}}\n💳 Pagamento: {{formaPagamento}}\n\nAcompanhe o status do seu pedido pelo site.',
  status_aceito:
    '📦 *PontoBom — Pedido #{{numero}}*\n\nStatus: ✅ Aceito — estamos preparando seu pedido!\n⏱️ Tempo estimado: {{estimativa}} minutos',
  status_em_preparo:
    '📦 *PontoBom — Pedido #{{numero}}*\n\nStatus: 👨‍🍳 Em preparo',
  status_pronto:
    '📦 *PontoBom — Pedido #{{numero}}*\n\nStatus: 🎉 Pronto para retirada! Pode vir buscar.',
  status_finalizado:
    '✔️ *PontoBom — Pedido #{{numero}}*\n\nSeu pedido foi finalizado. Obrigado pela preferência!',
  pedido_recusado:
    '❌ *PontoBom — Pedido #{{numero}} Recusado*\n\nMotivo: {{motivo}}\n\nPedimos desculpas pelo inconveniente. Entre em contato conosco para mais informações.',
};

async function obterTemplate(chave) {
  try {
    const registro = await prisma.mensagemTemplate.findUnique({ where: { chave } });
    return registro?.template || FALLBACKS[chave];
  } catch {
    return FALLBACKS[chave];
  }
}

// Substitui {{vars}}. Se o valor for null/undefined/"", remove a linha inteira que contém o placeholder.
function aplicar(template, vars) {
  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    if (v == null || v === '') {
      result = result.replace(new RegExp(`[^\n]*\\{\\{${k}\\}\\}[^\n]*\n?`, 'g'), '');
    } else {
      result = result.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return result.trim();
}

module.exports = { obterTemplate, aplicar, FALLBACKS };
