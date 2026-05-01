const { Router } = require('express');
const { autenticar, apenasAdmin } = require('../middlewares/auth.middleware');
const {
  listarSecoes, criarSecao, atualizarSecao, excluirSecao,
  listarItens, criarItem, atualizarItem, excluirItem,
} = require('../controllers/admin.controller');

const router = Router();

router.use(autenticar, apenasAdmin);

router.get('/secoes', listarSecoes);
router.post('/secoes', criarSecao);
router.put('/secoes/:id', atualizarSecao);
router.delete('/secoes/:id', excluirSecao);

router.get('/itens', listarItens);
router.post('/itens', criarItem);
router.put('/itens/:id', atualizarItem);
router.delete('/itens/:id', excluirItem);

module.exports = router;
