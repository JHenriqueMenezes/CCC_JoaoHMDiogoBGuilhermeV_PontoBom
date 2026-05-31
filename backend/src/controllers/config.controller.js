const prisma = require('../lib/prisma');

async function statusRestaurante(req, res) {
  try {
    const registro = await prisma.config.findUnique({ where: { chave: 'restaurante_aberto' } });
    res.json({ aberto: registro ? registro.valor === 'true' : true });
  } catch {
    res.json({ aberto: true });
  }
}

async function alternarRestaurante(req, res) {
  const { aberto } = req.body;
  if (typeof aberto !== 'boolean') {
    return res.status(400).json({ erro: 'Campo "aberto" deve ser boolean.' });
  }
  const registro = await prisma.config.upsert({
    where:  { chave: 'restaurante_aberto' },
    update: { valor: String(aberto) },
    create: { chave: 'restaurante_aberto', valor: String(aberto) },
  });
  res.json({ aberto: registro.valor === 'true' });
}

module.exports = { statusRestaurante, alternarRestaurante };
