const { Router } = require('express');
const { getAuth, register, login } = require('../controllers/Auth.controller');

const router = Router();

router.get('/me', getAuth);
router.post('/register', register);
router.post('/login', login);

module.exports = router;
