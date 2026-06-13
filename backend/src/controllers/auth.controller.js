const authService = require('../services/auth.service');

// POST /auth/cadastro - Registrar cliente e enviar código WhatsApp
async function cadastrar(req, res) {
  const { telefone: telefoneRaw, nome } = req.body;

  if (!telefoneRaw) {
    return res.status(400).json({ erro: 'Telefone é obrigatório.' });
  }

  try {
    const resultado = await authService.enviarCodigoParaUsuario(telefoneRaw, nome);
    res.json({ mensagem: resultado.mensagem, telefone: resultado.telefone });
  } catch (err) {
    res.status(err.status || 500).json({ erro: err.message });
  }
}

// POST /auth/verificar - Verificar código e autenticar cliente
async function verificar(req, res) {
  const { telefone: telefoneRaw, codigo } = req.body;

  if (!telefoneRaw || !codigo) {
    return res.status(400).json({ erro: 'Telefone e código são obrigatórios.' });
  }

  try {
    const resultado = await authService.verificarCodigo(telefoneRaw, codigo);
    res.json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ erro: err.message });
  }
}

// POST /auth/login - Login do administrador com usuário e senha
async function loginAdmin(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  try {
    const resultado = await authService.loginAdmin(email, senha);
    res.json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ erro: err.message });
  }
}

// POST /auth/login - Login de cliente existente via WhatsApp
async function loginCliente(req, res) {
  const { telefone: telefoneRaw } = req.body;

  if (!telefoneRaw) {
    return res.status(400).json({ erro: 'Telefone é obrigatório.' });
  }

  try {
    const resultado = await authService.enviarCodigoLogin(telefoneRaw);
    res.json({ mensagem: resultado.mensagem, telefone: resultado.telefone });
  } catch (err) {
    res.status(err.status || 500).json({ erro: err.message });
  }
}

module.exports = { cadastrar, verificar, loginAdmin, loginCliente };
