const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
  },
  content: {
    type: String,
    required: [true, 'Le contenu est requis'],
    trim: true,
    maxlength: [2000, 'Le contenu ne peut pas dépasser 2000 caractères'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index pour les recherches fréquentes
articleSchema.index({ title: 'text', content: 'text' });

articleSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Article', articleSchema);
