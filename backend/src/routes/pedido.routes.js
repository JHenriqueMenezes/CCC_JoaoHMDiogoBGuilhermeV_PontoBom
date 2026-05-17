const { Router } = require('express');
const { autenticar } = require('../middlewares/auth.middleware');
const { criarPedido } = require('../controllers/pedido.controller');

const router = Router();

router.post('/', autenticar, criarPedido);

module.exports = router;
