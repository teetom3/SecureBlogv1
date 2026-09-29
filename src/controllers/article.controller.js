const articleService = require('../services/article.service');

exports.list = async (req, res) => {
  const articles = await articleService.list();
  res.json({ articles });
};

exports.create = async (req, res) => {
  const { title, content } = req.body ?? {};
  const article = await articleService.create({ title, content, authorId: req.user.sub });
  res.status(201).json({ article });
};
