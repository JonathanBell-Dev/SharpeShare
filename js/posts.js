import { supabase } from './supabase.js';

async function checkAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;
  const show = id => document.querySelectorAll(`#${id}`).forEach(el => el.style.display = 'inline');
  const hide = id => document.querySelectorAll(`#${id}`).forEach(el => el.style.display = 'none');

  if (loggedIn) {
    show('createLink'); show('profileLink'); show('logoutLink');
    hide('loginLink'); hide('registerLink');
  } else {
    hide('createLink'); hide('profileLink'); hide('logoutLink');
    show('loginLink'); show('registerLink');
  }

  document.querySelectorAll('#logoutLink').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location = 'login.html';
    });
  });
}
checkAuthLinks();

async function loadPosts() {
  const feed = document.getElementById('feed');
  feed.innerHTML = '<p>Loading posts...</p>';

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading posts:', error);
    feed.innerHTML = '<p>Failed to load posts.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    feed.innerHTML = '<p>No posts yet. Be the first to share a pick!</p>';
    return;
  }

  feed.innerHTML = posts.map(p => `
    <div class="post">
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <p><strong>Sport:</strong> ${p.sport || 'N/A'} | <strong>Odds:</strong> ${p.odds || 'N/A'}</p>
      <small>By ${p.username || 'Anonymous'} — ${new Date(p.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadPosts);
