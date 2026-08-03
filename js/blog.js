document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('blogList');
  const postEl = document.getElementById('postContent');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ===== Blog listing page =====
  if (listEl) {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load posts');
        return res.json();
      })
      .then((posts) => {
        if (!posts.length) {
          listEl.innerHTML = '<p class="blog-empty">No posts yet — check back soon.</p>';
          return;
        }
        listEl.innerHTML = posts.map((post) => `
          <a href="/blog/${encodeURIComponent(post.slug)}" class="blog-card" data-cursor="Read">
            ${post.coverImage
              ? `<div class="blog-card-thumb"><img src="${escapeHtml(post.coverImage)}" alt=""></div>`
              : '<div class="blog-card-thumb blog-card-thumb--empty"></div>'}
            <div class="blog-card-body">
              <span class="blog-card-date">${formatDate(post.createdAt)}</span>
              <h3>${escapeHtml(post.title)}</h3>
              <p>${escapeHtml(post.excerpt)}</p>
            </div>
          </a>
        `).join('');
      })
      .catch(() => {
        listEl.innerHTML = '<p class="blog-empty">Couldn\'t load posts right now. Please try again later.</p>';
      });
  }

  // ===== Single post page =====
  if (postEl) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1];

    fetch(`/api/posts/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((post) => {
        document.title = `${post.title} — Theshan Adithya`;
        const titleTag = document.getElementById('pageTitle');
        if (titleTag) titleTag.textContent = `${post.title} — Theshan Adithya`;

        postEl.innerHTML = `
          <span class="post-date">${formatDate(post.createdAt)}</span>
          <h1 class="post-title">${escapeHtml(post.title)}</h1>
          ${post.tags && post.tags.length ? `<div class="post-tags">${post.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          ${post.coverImage ? `<div class="post-cover"><img src="${escapeHtml(post.coverImage)}" alt=""></div>` : ''}
          <div class="post-body">${post.content}</div>
        `;
      })
      .catch(() => {
        postEl.innerHTML = '<p class="blog-empty">This post couldn\'t be found.</p>';
      });
  }
});
