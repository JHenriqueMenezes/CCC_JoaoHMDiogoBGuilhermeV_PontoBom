const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const whatsapp = require('./whatsapp');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET não definido nas variáveis de ambiente.');

function erroComStatus(status, mensagem) {
  const err = new Error(mensagem);
  err.status = status;
  return err;
}

async function buscarUsuarioPorTelefone(raw) {
  const d = raw.replace(/\D/g, '');
  const variantes = new Set([d]);
  if (d.startsWith('55') && d.length >= 12) variantes.add(d.slice(2));
  else variantes.add('55' + d);

  for (const tel of variantes) {
    const u = await prisma.usuario.findUnique({ where: { telefone: tel } });
    if (u) return { usuario: u, telefone: tel };
  }
  return { usuario: null, telefone: d };
}

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function gerarExpiracao() {
  const expira = new Date();
  expira.setMinutes(expira.getMinutes() + 10);
  return expira;
}

async function enviarCodigo(usuario, telefone) {
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
}

async function enviarCodigoParaUsuario(telefoneRaw, nome) {
  const digits = telefoneRaw.replace(/\D/g, '');
  let { usuario, telefone } = await buscarUsuarioPorTelefone(digits);

  if (!usuario) {
    telefone = digits;
    usuario = await prisma.usuario.create({
      data: { telefone, nome, role: 'CLIENTE' },
    });
  }

  await enviarCodigo(usuario, telefone);

  return { usuario, telefone, mensagem: 'Código enviado via WhatsApp.' };
}

async function enviarCodigoLogin(telefoneRaw) {
  const { usuario, telefone } = await buscarUsuarioPorTelefone(telefoneRaw);

  if (!usuario) {
    throw erroComStatus(404, 'Nenhuma conta encontrada com esse número. Faça o cadastro primeiro.');
  }

  await enviarCodigo(usuario, telefone);

  return { telefone, mensagem: 'Código enviado via WhatsApp.' };
}

async function verificarCodigo(telefoneRaw, codigo) {
  const { usuario } = await buscarUsuarioPorTelefone(telefoneRaw);
  if (!usuario) {
    throw erroComStatus(404, 'Usuário não encontrado.');
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
    throw erroComStatus(400, 'Código inválido ou expirado.');
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

  return { token, usuario: { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone, role: usuario.role } };
}

async function loginAdmin(email, senha) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || usuario.role !== 'ADMIN' || !usuario.ativo) {
    throw erroComStatus(401, 'Credenciais inválidas.');
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    throw erroComStatus(401, 'Credenciais inválidas.');
  }

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } };
}

module.exports = {
  enviarCodigoParaUsuario,
  enviarCodigoLogin,
  verificarCodigo,
  loginAdmin,
};
