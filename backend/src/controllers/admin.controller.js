const prisma = require('../lib/prisma');

// ── Upload de imagem ───────────────────────────────────────────────────────────

async function uploadImagem(req, res) {
  if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
  // Cloudinary retorna a URL pública em req.file.path
  res.json({ url: req.file.path });
}

// ── Seções ────────────────────────────────────────────────────────────────────

async function listarSecoes(req, res) {
  try {
    const secoes = await prisma.secao.findMany({ orderBy: { ordem: 'asc' } });
    res.json({ secoes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar seções.' });
  }
}

async function criarSecao(req, res) {
  const { nome, ordem = 0, ativa = true } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });

  try {
    const secao = await prisma.secao.create({
      data: { nome: nome.trim(), ordem: Number(ordem), ativa },
    });
    res.status(201).json({ secao });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ erro: 'Já existe uma seção com esse nome.' });
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar seção.' });
  }
}

async function atualizarSecao(req, res) {
  const id = Number(req.params.id);
  const { nome, ordem, ativa } = req.body;

  try {
    const secao = await prisma.secao.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(ordem !== undefined && { ordem: Number(ordem) }),
        ...(ativa !== undefined && { ativa }),
      },
    });
    res.json({ secao });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Seção não encontrada.' });
    if (err.code === 'P2002') return res.status(400).json({ erro: 'Já existe uma seção com esse nome.' });
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar seção.' });
  }
}

async function excluirSecao(req, res) {
  const id = Number(req.params.id);

  try {
    await prisma.itemSecao.deleteMany({ where: { secaoId: id } });
    await prisma.secao.delete({ where: { id } });
    res.json({ mensagem: 'Seção excluída.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Seção não encontrada.' });
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir seção.' });
  }
}

// ── Itens ─────────────────────────────────────────────────────────────────────

function mapItem(item) {
  return {
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    preco: Number(item.preco),
    imagemUrl: item.imagemUrl ?? null,
    disponivel: item.disponivel,
    secoes: item.secoes?.map((rel) => rel.secao) ?? [],
  };
}

async function listarItens(req, res) {
  try {
    const itens = await prisma.item.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        secoes: { include: { secao: { select: { id: true, nome: true } } } },
      },
    });
    res.json({ itens: itens.map(mapItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar itens.' });
  }
}

async function criarItem(req, res) {
  const { nome, descricao, preco, imagemUrl, disponivel = true, secaoIds = [] } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  if (preco === undefined || preco === null) return res.status(400).json({ erro: 'Preço é obrigatório.' });

  try {
    const item = await prisma.item.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        preco: Number(preco),
        imagemUrl: imagemUrl || null,
        disponivel,
        secoes: { create: secaoIds.map((secaoId) => ({ secaoId: Number(secaoId) })) },
      },
      include: {
        secoes: { include: { secao: { select: { id: true, nome: true } } } },
      },
    });
    res.status(201).json({ item: mapItem(item) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar item.' });
  }
}

async function atualizarItem(req, res) {
  const id = Number(req.params.id);
  const { nome, descricao, preco, imagemUrl, disponivel, secaoIds } = req.body;

  try {
    if (secaoIds !== undefined) {
      await prisma.itemSecao.deleteMany({ where: { itemId: id } });
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
        ...(preco !== undefined && { preco: Number(preco) }),
        ...(imagemUrl !== undefined && { imagemUrl: imagemUrl || null }),
        ...(disponivel !== undefined && { disponivel }),
        ...(secaoIds !== undefined && {
          secoes: { create: secaoIds.map((secaoId) => ({ secaoId: Number(secaoId) })) },
        }),
      },
      include: {
        secoes: { include: { secao: { select: { id: true, nome: true } } } },
      },
    });
    res.json({ item: mapItem(item) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Item não encontrado.' });
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar item.' });
  }
}

async function excluirItem(req, res) {
  const id = Number(req.params.id);

  try {
    await prisma.itemSecao.deleteMany({ where: { itemId: id } });
    await prisma.item.delete({ where: { id } });
    res.json({ mensagem: 'Item excluído.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Item não encontrado.' });
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir item.' });
  }
}

module.exports = {
  uploadImagem,
  listarSecoes, criarSecao, atualizarSecao, excluirSecao,
  listarItens, criarItem, atualizarItem, excluirItem,
};
