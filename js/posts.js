// js/posts.js
import { supabase } from './supabase.js';

// ✅ Check login and toggle nav links
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

// ✅ Load posts with comments + likes
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
    document.getElementById('feed').innerHTML = '<p>No posts yet. Be the first to share a pick!</p>';
    return;
  }

  const feedDiv = document.getElementById('feed');
  const commentCounts = await getCommentCounts();
  const postLikeCounts = await getPostLikeCounts();

  feedDiv.innerHTML = posts.map(p => `
    <div class="post" data-id="${p.id}">
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <p><em>by <a href="user.html?id=${p.user_id}" class="username-link">${p.username || 'Anonymous'}</a></em></p>
      <p><strong>Sport:</strong> ${p.sport} | <strong>Odds:</strong> ${p.odds}</p>
      <small>Posted on ${new Date(p.created_at).toLocaleString()}</small>

      <div class="post-footer">
        <button class="like-post">❤️ ${postLikeCounts[p.id] || 0}</button>
        <button class="toggle-comments">💬 View Comments (${commentCounts[p.id] || 0})</button>
      </div>

      ${currentUser && currentUser.id === p.user_id ? `
        <div class="post-actions">
          <button class="edit-btn">✏️ Edit</button>
          <button class="delete-btn">🗑 Delete</button>
        </div>
      ` : ''}

      <div class="comments-section" style="display:none;">
        <div class="comment-list">Loading comments...</div>
        ${currentUser ? `
          <textarea class="new-comment" placeholder="Write a comment..."></textarea>
          <button class="add-comment">Post Comment</button>
        ` : '<p><em>Login to comment</em></p>'}
      </div>
    </div>
  `).join('');

  // ✅ Like posts
  document.querySelectorAll('.like-post').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const postId = postDiv.dataset.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Please log in to like posts.');

      // Check if already liked
      const { data: existing } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase.from('post_likes').delete().eq('id', existing.id);
      } else {
        // Like
        await supabase.from('post_likes').insert([{ post_id: postId, user_id: user.id }]);
      }

      const newCount = await getLikeCount('post_likes', 'post_id', postId);
      btn.textContent = `❤️ ${newCount}`;
    });
  });

  // ✅ Toggle comments visibility
  document.querySelectorAll('.toggle-comments').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const section = postDiv.querySelector('.comments-section');
      const list = postDiv.querySelector('.comment-list');
      if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(postDiv.dataset.id, list, btn);
      } else {
        section.style.display = 'none';
      }
    });
  });

  // ✅ Add comment
  document.querySelectorAll('.add-comment').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postDiv = e.target.closest('.post');
      const textarea = postDiv.querySelector('.new-comment');
      const content = textarea.value.trim();

      if (!content) return alert('Comment cannot be empty.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Please log in to comment.');

      const username = user.user_metadata?.username || 'Anonymous';
      const { error } = await supabase
        .from('comments')
        .insert([{ post_id: postDiv.dataset.id, user_id: user.id, username, content }]);

      if (error) {
        console.error('Error adding comment:', error.message);
        alert('Failed to add comment.');
      } else {
        textarea.value = '';
        await loadComments(postDiv.dataset.id, postDiv.querySelector('.comment-list'), postDiv.querySelector('.toggle-comments'));
      }
    });
  });
}

// ✅ Helpers for counts
async function getCommentCounts() {
  const { data: comments } = await supabase.from('comments').select('post_id');
  const counts = {};
  comments?.forEach(c => counts[c.post_id] = (counts[c.post_id] || 0) + 1);
  return counts;
}

async function getPostLikeCounts() {
  const { data: likes } = await supabase.from('post_likes').select('post_id');
  const counts = {};
  likes?.forEach(l => counts[l.post_id] = (counts[l.post_id] || 0) + 1);
  return counts;
}

async function getLikeCount(table, column, id) {
  const { data } = await supabase.from(table).select(column).eq(column, id);
  return data?.length || 0;
}

// ✅ Load comments (with likes!)
async function loadComments(postId, listElement, toggleBtn) {
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const commentLikeCounts = await getCommentLikeCounts(postId);

  if (!comments || comments.length === 0) {
    listElement.innerHTML = '<p>No comments yet.</p>';
    toggleBtn.textContent = '💬 View Comments (0)';
    return;
  }

  toggleBtn.textContent = `💬 View Comments (${comments.length})`;

  listElement.innerHTML = comments.map(c => `
    <div class="comment" data-id="${c.id}">
      <p>${c.content}</p>
      <small>by ${c.username || 'Anonymous'} • ${new Date(c.created_at).toLocaleString()}</small>
      <div class="comment-actions">
        <button class="like-comment">👍 ${commentLikeCounts[c.id] || 0}</button>
        ${currentUser && currentUser.id === c.user_id ? `<button class="delete-comment">🗑</button>` : ''}
      </div>
    </div>
  `).join('');

  // ✅ Comment likes
  listElement.querySelectorAll('.like-comment').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const commentDiv = e.target.closest('.comment');
      const commentId = commentDiv.dataset.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Please log in to like comments.');

      const { data: existing } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('comment_likes').delete().eq('id', existing.id);
      } else {
        await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: user.id }]);
      }

      const newCount = await getLikeCount('comment_likes', 'comment_id', commentId);
      btn.textContent = `👍 ${newCount}`;
    });
  });

  // ✅ Delete comments
  listElement.querySelectorAll('.delete-comment').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const commentDiv = e.target.closest('.comment');
      const commentId = commentDiv.dataset.id;
      if (!confirm('Delete this comment?')) return;

      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (!error) commentDiv.remove();
    });
  });
}

async function getCommentLikeCounts(postId) {
  const { data: likes } = await supabase
    .from('comment_likes')
    .select('comment_id, comments!inner(post_id)')
    .eq('comments.post_id', postId);

  const counts = {};
  likes?.forEach(l => counts[l.comment_id] = (counts[l.comment_id] || 0) + 1);
  return counts;
}

// ✅ Close popup if clicked outside
window.onclick = (event) => {
  const popup = document.getElementById('editPopup');
  if (popup && event.target === popup) popup.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', loadPosts);
