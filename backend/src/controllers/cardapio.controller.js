const prisma = require('../lib/prisma');

async function getCardapio(req, res) {
  try {
    const secoes = await prisma.secao.findMany({
      where: { ativa: true },
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          include: { item: true },
        },
      },
    });

    const resultado = secoes.map((secao) => ({
      id: secao.id,
      nome: secao.nome,
      ordem: secao.ordem,
      itens: secao.itens
        .map((rel) => rel.item)
        .filter((item) => item.disponivel)
        .map((item) => ({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao,
          preco: Number(item.preco),
          imagemUrl: item.imagemUrl ?? null,
          disponivel: item.disponivel,
        })),
    }));

    res.json({ secoes: resultado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar cardápio.' });
  }
}

module.exports = { getCardapio };
