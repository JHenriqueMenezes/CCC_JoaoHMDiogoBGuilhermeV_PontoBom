const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const whatsapp = require('../services/whatsapp');

const JWT_SECRET = process.env.JWT_SECRET || 'pontobom_secret';

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function gerarExpiracao() {
  const expira = new Date();
  expira.setMinutes(expira.getMinutes() + 10);
  return expira;
}

// POST /auth/cadastro - Registrar cliente e enviar código WhatsApp
async function cadastrar(req, res) {
  const { telefone, nome } = req.body;

  if (!telefone) {
    return res.status(400).json({ erro: 'Telefone é obrigatório.' });
  }

  let usuario = await prisma.usuario.findUnique({ where: { telefone } });

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: { telefone, nome, role: 'CLIENTE' },
    });
  }

  const codigo = gerarCodigo();
  await prisma.codigoVerificacao.create({
    data: {
      usuarioId: usuario.id,
      codigo,
      expiraEm: gerarExpiracao(),
    },
  });

  try {
    await whatsapp.enviarCodigoVerificacao(telefone, codigo);
  } catch (err) {
    // Fallback: se o WhatsApp falhar, mostra no console para não travar o fluxo
    console.warn(`⚠️  WhatsApp falhou para ${telefone}. Código: ${codigo}`);
    console.warn(err.message);
  }

  res.json({ mensagem: 'Código enviado via WhatsApp.', telefone });
}

// POST /auth/verificar - Verificar código e autenticar cliente
async function verificar(req, res) {
  const { telefone, codigo } = req.body;

  if (!telefone || !codigo) {
    return res.status(400).json({ erro: 'Telefone e código são obrigatórios.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { telefone } });
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  const registro = await prisma.codigoVerificacao.findFirst({
    where: {
      usuarioId: usuario.id,
      codigo,
      usado: false,
      expiraEm: { gt: new Date() },
    },
    orderBy: { criadoEm: 'desc' },
  });

  if (!registro) {
    return res.status(400).json({ erro: 'Código inválido ou expirado.' });
  }

  await prisma.codigoVerificacao.update({
    where: { id: registro.id },
    data: { usado: true },
  });

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone, role: usuario.role } });
}

// POST /auth/login - Login do administrador com usuário e senha
async function loginAdmin(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || usuario.role !== 'ADMIN') {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });
}

module.exports = { cadastrar, verificar, loginAdmin };
