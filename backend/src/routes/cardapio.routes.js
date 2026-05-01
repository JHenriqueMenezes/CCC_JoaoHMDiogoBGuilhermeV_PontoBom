const { Router } = require('express');
const { getCardapio } = require('../controllers/cardapio.controller');

const router = Router();

router.get('/', getCardapio);

module.exports = router;
