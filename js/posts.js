import { supabase } from './supabase.js';

async function checkAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;

  const toggle = (id, show) => {
    document.querySelectorAll(`#${id}`).forEach((el) => {
      el.style.display = show ? 'inline' : 'none';
    });
  };

  toggle('createLink', loggedIn);
  toggle('profileLink', loggedIn);
  toggle('logoutLink', loggedIn);
  toggle('loginLink', !loggedIn);
  toggle('registerLink', !loggedIn);

  // logout button
  document.querySelectorAll('#logoutLink').forEach((btn) => {
    btn.onclick = async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
        return;
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location = 'login.html';
    };
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

  feed.innerHTML = posts
    .map(
      (p) => `
      <div class="post">
        <h3>${p.title}</h3>
        <p>${p.content}</p>
        <p><strong>Sport:</strong> ${p.sport || 'N/A'} | <strong>Odds:</strong> ${p.odds || 'N/A'}</p>
        <small>By ${p.username || 'Anonymous'} — ${new Date(p.created_at).toLocaleString()}</small>
      </div>
    `
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', loadPosts);
