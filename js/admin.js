document.addEventListener('DOMContentLoaded', () => {
  const TOKEN_KEY = 'theshan_admin_token';

  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  const postsList = document.getElementById('postsList');
  const postForm = document.getElementById('postForm');
  const formMessage = document.getElementById('formMessage');
  const newPostBtn = document.getElementById('newPostBtn');
  const clearFormBtn = document.getElementById('clearFormBtn');
  const deletePostBtn = document.getElementById('deletePostBtn');

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function authHeaders() {
    return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
  }

  function showLogin() {
    loginView.style.display = '';
    dashboardView.style.display = 'none';
  }
  function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = '';
    loadPosts();
  }

  // ===== Login =====
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const data = new FormData(loginForm);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.get('username'), password: data.get('password') }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      setToken(json.token);
      showDashboard();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  logoutBtn.addEventListener('click', () => {
    clearToken();
    showLogin();
  });

  // ===== Posts list =====
  async function loadPosts() {
    postsList.innerHTML = '<p class="blog-loading">Loading&hellip;</p>';
    try {
      const res = await fetch('/api/posts/admin/all', { headers: authHeaders() });
      if (res.status === 401) { clearToken(); showLogin(); return; }
      const posts = await res.json();
      if (!posts.length) {
        postsList.innerHTML = '<p class="blog-empty">No posts yet.</p>';
        return;
      }
      postsList.innerHTML = posts.map((p) => `
        <button type="button" class="admin-post-row" data-id="${p._id}">
          <span class="admin-post-row-title">${p.title}</span>
          <span class="admin-post-row-status ${p.published ? 'is-published' : 'is-draft'}">${p.published ? 'Published' : 'Draft'}</span>
        </button>
      `).join('');

      postsList.querySelectorAll('.admin-post-row').forEach((btn) => {
        btn.addEventListener('click', () => loadPostIntoForm(posts.find((p) => p._id === btn.dataset.id)));
      });
    } catch (err) {
      postsList.innerHTML = '<p class="blog-empty">Failed to load posts.</p>';
    }
  }

  function loadPostIntoForm(post) {
    postForm.id.value = post._id;
    postForm.title.value = post.title;
    postForm.excerpt.value = post.excerpt;
    postForm.coverImage.value = post.coverImage || '';
    postForm.tags.value = (post.tags || []).join(', ');
    postForm.content.value = post.content;
    postForm.published.checked = post.published;
    deletePostBtn.style.display = '';
    formMessage.textContent = '';
  }

  function clearForm() {
    postForm.reset();
    postForm.id.value = '';
    postForm.published.checked = true;
    deletePostBtn.style.display = 'none';
    formMessage.textContent = '';
  }

  newPostBtn.addEventListener('click', clearForm);
  clearFormBtn.addEventListener('click', (e) => { e.preventDefault(); clearForm(); });

  // ===== Save (create or update) =====
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMessage.textContent = '';
    const id = postForm.id.value;
    const payload = {
      title: postForm.title.value,
      excerpt: postForm.excerpt.value,
      coverImage: postForm.coverImage.value,
      tags: postForm.tags.value,
      content: postForm.content.value,
      published: postForm.published.checked,
    };

    try {
      const res = await fetch(id ? `/api/posts/${id}` : '/api/posts', {
        method: id ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { clearToken(); showLogin(); return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      formMessage.textContent = 'Saved.';
      formMessage.classList.remove('is-error');
      loadPostIntoForm(json);
      loadPosts();
    } catch (err) {
      formMessage.textContent = err.message;
      formMessage.classList.add('is-error');
    }
  });

  // ===== Delete =====
  deletePostBtn.addEventListener('click', async () => {
    const id = postForm.id.value;
    if (!id) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.status === 401) { clearToken(); showLogin(); return; }
      if (!res.ok) throw new Error('Delete failed');
      clearForm();
      loadPosts();
    } catch (err) {
      formMessage.textContent = err.message;
      formMessage.classList.add('is-error');
    }
  });

  // ===== Boot: verify any existing token still works =====
  if (getToken()) {
    fetch('/api/posts/admin/all', { headers: authHeaders() })
      .then((res) => { if (res.ok) showDashboard(); else { clearToken(); showLogin(); } })
      .catch(() => showLogin());
  } else {
    showLogin();
  }
});
