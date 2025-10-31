// js/user.js
import { supabase } from './supabase.js';

async function checkAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();
  const logoutLink = document.getElementById('logoutLink');

  if (user) {
    logoutLink.style.display = 'inline';
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location = 'login.html';
    });
  }
}

// ✅ Load posts for a specific user
async function loadUserPosts() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  if (!userId) {
    document.getElementById('userFeed').innerHTML = '<p>User not found.</p>';
    return;
  }

  // Get one of the user's posts to display their username
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    document.getElementById('userFeed').innerHTML = '<p>Failed to load posts.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    document.getElementById('usernameHeader').textContent = 'User Profile';
    document.getElementById('usernameDisplay').textContent = 'This user has no posts yet.';
    document.getElementById('userFeed').innerHTML = '';
    return;
  }

  const username = posts[0].username || 'Anonymous';
  document.getElementById('usernameHeader').textContent = `${username}'s Profile`;
  document.getElementById('usernameDisplay').textContent = username;

  const feedDiv = document.getElementById('userFeed');
  feedDiv.innerHTML = posts.map(p => `
    <div class="post">
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
      <small>Posted on ${new Date(p.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuthLinks();
  loadUserPosts();
});
