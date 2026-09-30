const articleService = require('../services/article.service');

exports.list = async (req, res) => {
  const articles = await articleService.list();
  res.json({ articles });
};

exports.getById = async (req, res) => {
  const { articleId } = req.params;
  const article = await articleService.getById(articleId);
  res.json({ article });
};

exports.create = async (req, res) => {
  const { title, content } = req.body ?? {};
  const article = await articleService.create({ title, content, authorId: req.user.sub });
  res.status(201).json({ article });
};

exports.edit = async (req, res) => {
  const { articleId } = req.params;
  const { title, content } = req.body ?? {};
  const article = await articleService.edit(articleId, req.user.sub, { title, content });
  res.json({ article });
};

exports.remove = async (req, res) => {
  const { articleId } = req.params;
  await articleService.remove(articleId, req.user.sub );
  res.status(204).send();
}

