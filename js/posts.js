// js/posts.js
import { supabase } from './supabase.js';

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

      <button class="toggle-comments">💬 View Comments</button>
      <div class="comments-section" style="display:none;">
        <div class="comment-list">Loading comments...</div>
        ${currentUser ? `
          <textarea class="new-comment" placeholder="Write a comment..."></textarea>
          <button class="add-comment">Post Comment</button>
        ` : '<p><em>Login to comment</em></p>'}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.toggle-comments').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const section = postDiv.querySelector('.comments-section');
      const list = postDiv.querySelector('.comment-list');
      if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(postDiv.dataset.id, list);
      } else {
        section.style.display = 'none';
      }
    });
  });

  document.querySelectorAll('.add-comment').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const textarea = postDiv.querySelector('.new-comment');
      const content = textarea.value.trim();
      if (!content) return alert('Comment cannot be empty.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('You must be logged in to comment.');

      const username = user.user_metadata?.username || 'Anonymous';
      const { error } = await supabase
        .from('comments')
        .insert([{ post_id: postDiv.dataset.id, user_id: user.id, username, content }]);

      if (error) {
        console.error('Error adding comment:', error.message);
        alert('Failed to add comment.');
      } else {
        textarea.value = '';
        await loadComments(postDiv.dataset.id, postDiv.querySelector('.comment-list'));
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const postId = postDiv.dataset.id;
      if (!confirm('Delete this post?')) return;

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) alert('Failed to delete post.');
      else postDiv.remove();
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
      const { error } = await supabase
        .from('posts')
        .update({ title: newTitle, content: newContent })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) alert('Failed to update post.');
      else loadPosts();
    });
  });
}

// ✅ Load comments for a post
async function loadComments(postId, listElement) {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading comments:', error.message);
    listElement.innerHTML = '<p>Failed to load comments.</p>';
    return;
  }

  if (!comments || comments.length === 0) {
    listElement.innerHTML = '<p>No comments yet.</p>';
    return;
  }

  listElement.innerHTML = comments.map(c => `
    <div class="comment" data-id="${c.id}">
      <p>${c.content}</p>
      <small>by ${c.username || 'Anonymous'} • ${new Date(c.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadPosts);
