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
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('feed').innerHTML = '<p>Failed to load posts.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    document.getElementById('feed').innerHTML = '<p>No posts yet.</p>';
    return;
  }

  const feed = document.getElementById('feed');
  feed.innerHTML = posts.map(p => `
    <div class="post">
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
      <small>By ${p.username || 'Anonymous'} — ${new Date(p.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadPosts);
