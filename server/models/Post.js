const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
