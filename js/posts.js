// js/posts.js
import { supabase } from './supabase.js';

async function checkAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;

  const toggle = (id, show) =>
    document.getElementById(id)?.style.setProperty('display', show ? 'inline' : 'none');

  toggle('createLink', loggedIn);
  toggle('profileLink', loggedIn);
  toggle('logoutLink', loggedIn);
  toggle('loginLink', !loggedIn);
  toggle('registerLink', !loggedIn);

  document.getElementById('logoutLink')?.addEventListener('click', async e => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location = 'login.html';
  });

  return user;
}

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

  feed.innerHTML = posts
    .map(
      p => `
      <div class="post" data-id="${p.id}">
        <h3>${p.title}</h3>
        <p>${p.content}</p>
        <p><em>by <a href="user.html?id=${p.user_id}">${p.username || 'Anonymous'}</a></em></p>
        <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
        <small>${new Date(p.created_at).toLocaleString()}</small>

        <div class="post-actions">
          ${
            currentUser && currentUser.id === p.user_id
              ? `<button class="edit-btn">✏️ Edit</button>
                 <button class="delete-btn">🗑 Delete</button>`
              : ''
          }
          ${
            currentUser
              ? `<button class="like-btn">❤️ Like</button>
                 <span class="like-count" id="likes-${p.id}">0</span>`
              : ''
          }
          <button class="toggle-comments">💬 View Comments</button>
        </div>

        <div class="comments-section" style="display:none;">
          <div class="comment-list">Loading comments...</div>
          ${
            currentUser
              ? `<textarea class="new-comment" placeholder="Write a comment..."></textarea>
                 <button class="add-comment">Post Comment</button>`
              : '<p><em>Login to comment</em></p>'
          }
        </div>
      </div>`
    )
    .join('');

  attachPostListeners(currentUser);
  updateLikeCounts();
}

// attach all button handlers
function attachPostListeners(currentUser) {
  // delete post
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', async e => {
      const id = e.target.closest('.post').dataset.id;
      if (!confirm('Delete this post?')) return;
      const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', currentUser.id);
      if (error) alert(error.message);
      else e.target.closest('.post').remove();
    })
  );

  // edit post
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', async e => {
      const id = e.target.closest('.post').dataset.id;
      const title = prompt('New title:');
      const content = prompt('New content:');
      if (!title || !content) return;
      const { error } = await supabase
        .from('posts')
        .update({ title, content })
        .eq('id', id)
        .eq('user_id', currentUser.id);
      if (error) alert(error.message);
      else loadPosts();
    })
  );

  // toggle comments
  document.querySelectorAll('.toggle-comments').forEach(btn =>
    btn.addEventListener('click', async e => {
      const post = e.target.closest('.post');
      const section = post.querySelector('.comments-section');
      const list = post.querySelector('.comment-list');
      if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(post.dataset.id, list);
      } else section.style.display = 'none';
    })
  );

  // add comment
  document.querySelectorAll('.add-comment').forEach(btn =>
    btn.addEventListener('click', async e => {
      const post = e.target.closest('.post');
      const text = post.querySelector('.new-comment').value.trim();
      if (!text) return alert('Empty comment.');
      const { data: { user } } = await supabase.auth.getUser();
      const username = user.user_metadata?.username || 'Anonymous';
      const { error } = await supabase
        .from('comments')
        .insert([{ post_id: Number(post.dataset.id), user_id: user.id, username, content: text }]);
      if (error) alert(error.message);
      else {
        post.querySelector('.new-comment').value = '';
        await loadComments(post.dataset.id, post.querySelector('.comment-list'));
      }
    })
  );

  // like/unlike
  document.querySelectorAll('.like-btn').forEach(btn =>
    btn.addEventListener('click', async e => {
      const postId = e.target.closest('.post').dataset.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Login first.');

      try {
        const { data: existing, error: selectError } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (selectError) throw selectError;

        if (existing?.length) {
          const { error: delError } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);
          if (delError) throw delError;
        } else {
          const { error: insError } = await supabase
            .from('likes')
            .insert([{ post_id: Number(postId), user_id: user.id }]);
          if (insError) throw insError;
        }

        await updateLikeCounts();
      } catch (err) {
        console.error('Like error:', err.message);
        alert('Error: ' + err.message);
      }
    })
  );
}

// refresh like counts
async function updateLikeCounts() {
  const { data, error } = await supabase
    .from('likes')
    .select('post_id, count:id')
    .group('post_id');

  if (error) {
    console.error('Like count error:', error.message);
    return;
  }

  data.forEach(row => {
    const el = document.getElementById(`likes-${row.post_id}`);
    if (el) el.textContent = row.count;
  });
}

// load comments
async function loadComments(postId, list) {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    list.innerHTML = '<p>Failed to load comments.</p>';
    console.error(error.message);
    return;
  }

  if (!comments?.length) {
    list.innerHTML = '<p>No comments yet.</p>';
    return;
  }

  list.innerHTML = comments
    .map(
      c =>
        `<div class="comment"><p>${c.content}</p><small>${c.username} • ${new Date(
          c.created_at
        ).toLocaleString()}</small></div>`
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', loadPosts);
