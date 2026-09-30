const Article = require('../models/article.model');
const httpError = require('../utils/httpError');
const mongoose = require('mongoose');
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

exports.getById = (articleId) => {
  if (!mongoose.isObjectIdOrHexString(articleId)) {
    throw httpError(400, 'Identifiant d\'article invalide');
  }
  return Article.findById(articleId).populate('author', 'email');
};

exports.edit = async (articleId, userId, { title, content }) => {

   if (!mongoose.isObjectIdOrHexString(articleId)) {
    throw httpError(400, 'Identifiant d\'article invalide');
  }

  const article = await Article.findById(articleId);
  if (!article) {
    throw httpError(404, 'Article non trouvé');
  }
  

  if (article.author.toString() !== userId) {
    throw httpError(403, 'Vous n\'êtes pas autorisé à modifier cet article');
  }

  if (typeof title !== 'string' || typeof content !== 'string') {
    throw httpError(400, 'Titre et contenu requis');
  }

  try {
    article.title = title;
    article.content = content;
    await article.save();
    return article.populate('author', 'email');
  } catch (err) {
    if (err.name === 'ValidationError') {
      throw httpError(400, Object.values(err.errors).map((e) => e.message).join(', '));
    }
    throw err;
  }
};

 

 


exports.remove = async (articleId, userId) => {
     if (!mongoose.isObjectIdOrHexString(articleId)) {
    throw httpError(400, 'Identifiant d\'article invalide');
  }
  const article = await Article.findById(articleId);
  if (!article) {
    throw httpError(404, 'Article non trouvé');
  }
  if (article.author.toString() !== userId) {
    throw httpError(403, 'Vous n\'êtes pas autorisé à supprimer cet article');
  }
    await article.deleteOne(); 
  
};



