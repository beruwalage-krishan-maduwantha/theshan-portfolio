const path = require('path');
const express = require('express');
const { app, connectDB } = require('./app');

const PORT = process.env.PORT || 3000;

// Serve ONLY the actual public assets (css/js/images) and pages — NOT the
// whole project root. The project root also contains the /theshan folder
// (raw resume PDFs with his NIC number, phone, and home address) and the
// /server backend source; blanket `express.static(ROOT_DIR)` would have
// quietly made all of that downloadable to anyone who found/guessed the URL.
const ROOT_DIR = path.join(__dirname, '..');
app.use('/css', express.static(path.join(ROOT_DIR, 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'js')));
app.use('/assets', express.static(path.join(ROOT_DIR, 'assets')));

const PUBLIC_PAGES = ['index.html', 'blog.html', 'blog-post.html', 'admin.html'];
PUBLIC_PAGES.forEach((page) => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(ROOT_DIR, page)));
});
app.get('/', (req, res) => res.sendFile(path.join(ROOT_DIR, 'index.html')));

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'blog-post.html'));
});

// The portfolio pages themselves don't need the database, so the HTTP server
// starts immediately — only the /api/posts routes actually need MongoDB, and
// they'll just fail individually (blog.js shows a friendly error) if it's
// down. This also means a Mongo connection hiccup can't take the whole site
// offline.
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

connectDB().catch(() => {
  console.error('The site itself still works — only blog/admin features need the database.');
});
