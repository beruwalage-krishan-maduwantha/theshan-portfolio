const express = require('express');
const Post = require('../models/Post');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Every handler below is wrapped in try/catch: a DB hiccup (e.g. Mongo
// temporarily unreachable) must return a normal error response, not throw an
// unhandled promise rejection — Node kills the whole process on those, which
// would take the entire site down over a transient database issue.

// GET /api/posts — public, published posts only, newest first
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ published: true }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(503).json({ error: 'Could not reach the database' });
  }
});

// GET /api/posts/admin/all — admin only, includes drafts
// (must be registered before the generic "/:slug" route below, or Express
// would match "admin" itself as a :slug value and this route would never fire)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(503).json({ error: 'Could not reach the database' });
  }
});

// GET /api/posts/:slug — public, single published post
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, published: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(503).json({ error: 'Could not reach the database' });
  }
});

// POST /api/posts — admin only, create
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags, published } = req.body || {};
    if (!title || !excerpt || !content) {
      return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    let slug = slugify(title);
    const existing = await Post.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const post = await Post.create({
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || '',
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []),
      published: published !== false,
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(503).json({ error: 'Failed to create post — could not reach the database' });
  }
});

// PUT /api/posts/:id — admin only, update
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags, published } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = title;
    if (excerpt !== undefined) update.excerpt = excerpt;
    if (content !== undefined) update.content = content;
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (tags !== undefined) {
      update.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
    }
    if (published !== undefined) update.published = published;

    const post = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(503).json({ error: 'Failed to update post — could not reach the database' });
  }
});

// DELETE /api/posts/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(503).json({ error: 'Failed to delete post — could not reach the database' });
  }
});

module.exports = router;
