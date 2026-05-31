const { Router } = require('express');
const { autenticar, apenasAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload');
const {
  uploadImagem,
  listarSecoes, criarSecao, atualizarSecao, excluirSecao,
  listarItens, criarItem, atualizarItem, excluirItem,
} = require('../controllers/admin.controller');
const {
  listarPedidosAdmin,
  metricas,
  aceitarPedido,
  recusarPedido,
  atualizarStatusPedido,
} = require('../controllers/pedido.controller');
const { listarMensagens, atualizarMensagem } = require('../controllers/mensagem.controller');

const router = Router();

router.use(autenticar, apenasAdmin);

// ── Imagens ──────────────────────────────────────────────────────────────────
router.post('/upload', upload.single('imagem'), uploadImagem);

// ── Seções ───────────────────────────────────────────────────────────────────
router.get('/secoes', listarSecoes);
router.post('/secoes', criarSecao);
router.put('/secoes/:id', atualizarSecao);
router.delete('/secoes/:id', excluirSecao);

// ── Itens ────────────────────────────────────────────────────────────────────
router.get('/itens', listarItens);
router.post('/itens', criarItem);
router.put('/itens/:id', atualizarItem);
router.delete('/itens/:id', excluirItem);

// ── Mensagens WhatsApp ───────────────────────────────────────────────────────
router.get('/mensagens', listarMensagens);
router.put('/mensagens/:chave', atualizarMensagem);

// ── Pedidos — /metrics deve vir antes de /:id ────────────────────────────────
router.get('/pedidos/metrics', metricas);
router.get('/pedidos', listarPedidosAdmin);
router.post('/pedidos/:id/aceitar', aceitarPedido);
router.post('/pedidos/:id/recusar', recusarPedido);
router.patch('/pedidos/:id/status', atualizarStatusPedido);

module.exports = router;
