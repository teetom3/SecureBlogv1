// src/models/Article.js
import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  content: {
    type: String,
    required: [true, 'Le contenu est requis'],
    maxlength: [2000, 'Le contenu ne peut pas dépasser 2000 caractères']
  },


}, {
  timestamps: true
});

// Index pour les recherches fréquentes
articleSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Article', articleSchema);