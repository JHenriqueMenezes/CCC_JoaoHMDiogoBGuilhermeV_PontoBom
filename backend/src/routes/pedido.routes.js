const { Router } = require('express');
const { autenticar } = require('../middlewares/auth.middleware');
const {
  criarPedido,
  consultarPagamentoPedido,
  meusPedidos,
  detalharPedido,
} = require('../controllers/pedido.controller');

const router = Router();

router.post('/', autenticar, criarPedido);

// /me deve vir antes de /:numero para não ser capturado como parâmetro
router.get('/me', autenticar, meusPedidos);

router.get('/:numero/pagamento', autenticar, consultarPagamentoPedido);
router.get('/:numero', autenticar, detalharPedido);

module.exports = router;
