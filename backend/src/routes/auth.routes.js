const { Router } = require('express');
const { cadastrar, verificar, loginAdmin } = require('../controllers/auth.controller');

const router = Router();

router.post('/cadastro', cadastrar);
router.post('/verificar', verificar);
router.post('/login-admin', loginAdmin);

module.exports = router;
