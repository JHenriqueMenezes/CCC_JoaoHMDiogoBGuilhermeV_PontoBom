const prisma = require('../lib/prisma');
const { FALLBACKS } = require('../services/whatsapp/templates');

const DESCRICOES = {
  codigo_verificacao: 'Enviada no cadastro e login via WhatsApp · variáveis: {{codigo}}',
  pedido_confirmado:  'Enviada quando o pedido é criado · variáveis: {{numero}}, {{itens}}, {{total}}, {{formaPagamento}}',
  status_aceito:      'Enviada quando o admin aceita o pedido · variáveis: {{numero}}, {{estimativa}}',
  status_em_preparo:  'Enviada quando o preparo começa · variáveis: {{numero}}',
  status_pronto:      'Enviada quando o pedido está pronto · variáveis: {{numero}}',
  status_finalizado:  'Enviada quando o cliente retira o pedido · variáveis: {{numero}}',
  pedido_recusado:    'Enviada quando o admin recusa o pedido · variáveis: {{numero}}, {{motivo}}',
};

async function listarMensagens(req, res) {
  const registros = await prisma.mensagemTemplate.findMany();
  const porChave = Object.fromEntries(registros.map((r) => [r.chave, r]));

  const resultado = Object.keys(FALLBACKS).map((chave) => ({
    chave,
    template:     porChave[chave]?.template ?? FALLBACKS[chave],
    descricao:    DESCRICOES[chave] ?? '',
    atualizadoEm: porChave[chave]?.atualizadoEm ?? null,
  }));

  res.json(resultado);
}

async function atualizarMensagem(req, res) {
  const { chave } = req.params;
  const { template } = req.body;

  if (!Object.keys(FALLBACKS).includes(chave)) {
    return res.status(404).json({ erro: 'Template não encontrado.' });
  }
  if (!template || !template.trim()) {
    return res.status(400).json({ erro: 'Template não pode ser vazio.' });
  }

  const registro = await prisma.mensagemTemplate.upsert({
    where:  { chave },
    update: { template },
    create: { chave, template, descricao: DESCRICOES[chave] },
  });

  res.json(registro);
}

module.exports = { listarMensagens, atualizarMensagem };
