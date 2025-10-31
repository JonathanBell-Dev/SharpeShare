// js/posts.js
import { supabase } from './supabase.js';

// ==========================
//  AUTH + NAVBAR HANDLING
// ==========================
async function checkAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;

  const show = id => document.querySelectorAll(`#${id}`).forEach(el => el.style.display = 'inline');
  const hide = id => document.querySelectorAll(`#${id}`).forEach(el => el.style.display = 'none');

  if (loggedIn) {
    show('createLink');
    show('profileLink');
    show('logoutLink');
    hide('loginLink');
    hide('registerLink');
  } else {
    hide('createLink');
    hide('profileLink');
    hide('logoutLink');
    show('loginLink');
    show('registerLink');
  }

  // Logout
  document.querySelectorAll('#logoutLink').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location = 'login.html';
    });
  });

  return user;
}

// ==========================
//  LOAD POSTS
// ==========================
async function loadPosts() {
  const currentUser = await checkAuthLinks();

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    document.getElementById('feed').innerHTML = '<p>Failed to load posts.</p>';
    return;
  }

  const feed = document.getElementById('feed');
  if (!posts?.length) {
    feed.innerHTML = '<p>No posts yet.</p>';
    return;
  }

  feed.innerHTML = posts.map(
    p => `
      <div class="post" data-id="${p.id}">
        <h3>${p.title}</h3>
        <p>${p.content}</p>
        <p><em>by <a href="user.html?id=${p.user_id}">${p.username || 'Anonymous'}</a></em></p>
        <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
        <small>${new Date(p.created_at).toLocaleString()}</small>
      </div>`
  ).join('');
}

document.addEventListener('DOMContentLoaded', loadPosts);
