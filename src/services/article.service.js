const Article = require('../models/article.model');
const httpError = require('../utils/httpError');

exports.list = () => Article.find()
  .sort({ createdAt: -1 })
  .limit(50)
  .populate('author', 'email');

exports.create = async ({ title, content, authorId }) => {
  if (typeof title !== 'string' || typeof content !== 'string') {
    throw httpError(400, 'Titre et contenu requis');
  }

  try {
    const article = await Article.create({ title, content, author: authorId });
    return article.populate('author', 'email');
  } catch (err) {
    if (err.name === 'ValidationError') {
      throw httpError(400, Object.values(err.errors).map((e) => e.message).join(', '));
    }
    throw err;
  }
};
