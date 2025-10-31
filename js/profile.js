// js/profile.js
import { supabase } from './supabase.js';

async function loadProfile() {
  // Check if the user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert('You must be logged in to view your profile.');
    window.location = 'login.html';
    return;
  }

  // Display user info
  document.getElementById('username').textContent = user.user_metadata?.username || 'Unknown User';
  document.getElementById('email').textContent = user.email;

  // Fetch user’s posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const postsDiv = document.getElementById('userPosts');
  const postCountSpan = document.getElementById('postCount');

  if (error) {
    console.error('Error loading posts:', error.message);
    postsDiv.innerHTML = '<p>Failed to load your posts.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    postsDiv.innerHTML = '<p>You haven’t created any posts yet.</p>';
    postCountSpan.textContent = '0';
    return;
  }

  // Show total post count
  postCountSpan.textContent = posts.length;

  // Display user’s posts
  postsDiv.innerHTML = posts.map(p => `
    <div class="post">
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
      <small>Posted on ${new Date(p.created_at).toLocaleString()}</small>
    </div>
  `).join('');

  // Logout
  const logoutBtn = document.getElementById('logoutLink');
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', loadProfile);
