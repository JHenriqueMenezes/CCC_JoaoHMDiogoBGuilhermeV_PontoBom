const { Router } = require('express');
const { autenticar } = require('../middlewares/auth.middleware');
const { criarPedido, consultarPagamentoPedido } = require('../controllers/pedido.controller');

const router = Router();

router.post('/', autenticar, criarPedido);
router.get('/:numero/pagamento', autenticar, consultarPagamentoPedido);

module.exports = router;
