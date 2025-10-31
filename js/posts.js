// js/posts.js
import { supabase } from './supabase.js';

// ✅ Check authentication and show/hide nav links
async function checkAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    document.getElementById('createLink').style.display = 'inline';
    document.getElementById('profileLink').style.display = 'inline';
    document.getElementById('logoutLink').style.display = 'inline';
    document.getElementById('loginLink').style.display = 'none';
    document.getElementById('registerLink').style.display = 'none';
  } else {
    document.getElementById('createLink').style.display = 'none';
    document.getElementById('profileLink').style.display = 'none';
    document.getElementById('logoutLink').style.display = 'none';
  }

  const logoutBtn = document.getElementById('logoutLink');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location = 'login.html';
    });
  }

  return user;
}

// ✅ Load all posts
async function loadPosts() {
  const currentUser = await checkAuthLinks();

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading posts:', error.message);
    document.getElementById('feed').innerHTML = '<p>Failed to load posts.</p>';
    return;
  }

  if (!posts || posts.length === 0) {
    document.getElementById('feed').innerHTML = '<p>No posts yet.</p>';
    return;
  }

  const feedDiv = document.getElementById('feed');
  feedDiv.innerHTML = posts.map(p => `
    <div class="post" data-id="${p.id}">
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <p><em>by <a href="user.html?id=${p.user_id}" class="username-link">${p.username || 'Anonymous'}</a></em></p>
      <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
      <small>Posted on ${new Date(p.created_at).toLocaleString()}</small>

      ${currentUser && currentUser.id === p.user_id ? `
        <div class="post-actions">
          <button class="edit-btn">✏️ Edit</button>
          <button class="delete-btn">🗑 Delete</button>
        </div>
      ` : ''}
    </div>
  `).join('');

  // ✅ Add event listeners for delete and edit
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const postId = postDiv.dataset.id;
      if (!confirm('Delete this post?')) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to delete.');
        return;
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete error:', error.message);
        alert('Failed to delete post.');
      } else {
        postDiv.remove();
      }
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const postId = postDiv.dataset.id;

      const newTitle = prompt('Enter new title:');
      const newContent = prompt('Enter new content:');
      if (!newTitle || !newContent) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to edit.');
        return;
      }

      const { error } = await supabase
        .from('posts')
        .update({ title: newTitle, content: newContent })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Edit error:', error.message);
        alert('Failed to update post.');
      } else {
        alert('Post updated!');
        loadPosts(); // Refresh the feed
      }
    });
  });
}

// ✅ Initialize on load
document.addEventListener('DOMContentLoaded', loadPosts);
