const { Router } = require('express');
const { list, create } = require('../controllers/article.controller');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

router.get('/', list);
router.post('/', requireAuth, create);

module.exports = router;
