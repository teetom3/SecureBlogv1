const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const articleRoutes = require('./article.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/articles', articleRoutes);
router.use('/', authRoutes);

module.exports = router;
