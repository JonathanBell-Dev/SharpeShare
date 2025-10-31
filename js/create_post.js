// js/create_post.js
import { supabase } from './supabase.js';

async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('You must be logged in to create a post.');
    window.location = 'login.html';
  }
  return user;
}

async function createPost() {
  const user = await checkUser();

  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const sport = document.getElementById('sport').value.trim();
  const odds = document.getElementById('odds').value.trim();

  if (!title || !content || !sport || !odds) {
    document.getElementById('message').textContent = 'Please fill out all fields.';
    return;
  }

  // ✅ Pull username from Auth metadata
  const username = user.user_metadata?.username || 'Anonymous';

  // ✅ Insert post including username
  const { error } = await supabase
    .from('posts')
    .insert([
      {
        user_id: user.id,
        username,
        title,
        content,
        sport,
        odds
      }
    ]);

  if (error) {
    console.error(error);
    document.getElementById('message').textContent = 'Error creating post: ' + error.message;
  } else {
    document.getElementById('message').textContent = 'Post created successfully!';
    setTimeout(() => {
      window.location = 'index.html';
    }, 1000);
  }
}

document.getElementById('postBtn').addEventListener('click', createPost);

// Logout
const logoutBtn = document.getElementById('logoutLink');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location = 'login.html';
  });
}
