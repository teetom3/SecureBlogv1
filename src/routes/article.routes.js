const { Router } = require('express');
const { list, create, remove, edit, getById } = require('../controllers/article.controller');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

router.get('/', list);
router.post('/', requireAuth, create);
router.put('/:articleId', requireAuth, edit);
router.delete('/:articleId', requireAuth, remove);
router.get('/:articleId', getById);
module.exports = router;
