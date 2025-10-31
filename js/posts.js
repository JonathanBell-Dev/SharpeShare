// js/posts.js
import { supabase } from './supabase.js';

// ==========================
//  AUTH + NAVBAR HANDLING
// ==========================
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

        <div class="post-actions">
          ${currentUser && currentUser.id === p.user_id
            ? `<button class="edit-btn">✏️ Edit</button>
               <button class="delete-btn">🗑 Delete</button>`
            : ''}
          ${currentUser
            ? `<button class="like-btn">❤️ Like</button>
               <span class="like-count" id="likes-${p.id}">0</span>`
            : ''}
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
  ).join('');

  attachPostListeners(currentUser);
  updateLikeCounts();
}

// ==========================
//  POST ACTION LISTENERS
// ==========================
function attachPostListeners(currentUser) {
  // Delete Post
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', async e => {
      const id = e.target.closest('.post').dataset.id;
      if (!confirm('Delete this post?')) return;
      const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', currentUser.id);
      if (error) alert(error.message);
      else e.target.closest('.post').remove();
    })
  );

  // ✅ Inline Post Editing (Title, Content, Sport, Odds)
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      const postDiv = e.target.closest('.post');
      const id = postDiv.dataset.id;
      const titleEl = postDiv.querySelector('h3');
      const contentEl = postDiv.querySelector('p');
      const infoEl = postDiv.querySelector('p + p + p'); // sport/odds paragraph

      const oldTitle = titleEl.textContent;
      const oldContent = contentEl.textContent;

      // Extract sport/odds text
      const infoText = infoEl?.textContent || '';
      const sportMatch = infoText.match(/Sport:\s*([^|]+)/);
      const oddsMatch = infoText.match(/Odds:\s*(.+)$/);
      const oldSport = sportMatch ? sportMatch[1].trim() : '';
      const oldOdds = oddsMatch ? oddsMatch[1].trim() : '';

      // Input fields
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = oldTitle;
      titleInput.className = 'post-edit-title';

      const contentBox = document.createElement('textarea');
      contentBox.value = oldContent;
      contentBox.className = 'post-edit-box';

      const sportInput = document.createElement('input');
      sportInput.type = 'text';
      sportInput.value = oldSport;
      sportInput.placeholder = 'Sport';
      sportInput.className = 'post-edit-sport';

      const oddsInput = document.createElement('input');
      oddsInput.type = 'text';
      oddsInput.value = oldOdds;
      oddsInput.placeholder = 'Odds';
      oddsInput.className = 'post-edit-odds';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = '💾 Save';
      saveBtn.className = 'save-post';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.className = 'cancel-post';

      // Replace display elements
      titleEl.replaceWith(titleInput);
      contentEl.replaceWith(contentBox);
      infoEl.replaceWith(sportInput, oddsInput);
      btn.parentElement.replaceChildren(saveBtn, cancelBtn);

      // Save
      saveBtn.addEventListener('click', async () => {
        const newTitle = titleInput.value.trim();
        const newContent = contentBox.value.trim();
        const newSport = sportInput.value.trim();
        const newOdds = oddsInput.value.trim();

        if (!newTitle || !newContent) return alert('Title and content required.');

        const { error } = await supabase
          .from('posts')
          .update({
            title: newTitle,
            content: newContent,
            sport: newSport,
            odds: newOdds
          })
          .eq('id', id)
          .eq('user_id', currentUser.id);

        if (error) {
          alert('Failed to update post.');
          console.error(error.message);
          return;
        }

        const newInfo = document.createElement('p');
        newInfo.innerHTML = `<strong>Sport:</strong> ${newSport} | <strong>Odds:</strong> ${newOdds}`;

        titleInput.replaceWith(titleEl);
        contentBox.replaceWith(contentEl);
        sportInput.remove();
        oddsInput.remove();

        titleEl.textContent = newTitle;
        contentEl.textContent = newContent;
        infoEl?.replaceWith?.(newInfo);

        loadPosts();
      });

      // Cancel
      cancelBtn.addEventListener('click', () => {
        titleInput.replaceWith(titleEl);
        contentBox.replaceWith(contentEl);

        const oldInfo = document.createElement('p');
        oldInfo.innerHTML = `<strong>Sport:</strong> ${oldSport} | <strong>Odds:</strong> ${oldOdds}`;
        sportInput.remove();
        oddsInput.remove();
        infoEl?.replaceWith?.(oldInfo);

        titleEl.textContent = oldTitle;
        contentEl.textContent = oldContent;

        loadPosts();
      });
    })
  );

  // Toggle Comments
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

  // Add Comment
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

  // Like/Unlike
  document.querySelectorAll('.like-btn').forEach(btn =>
    btn.addEventListener('click', async e => {
      const postId = e.target.closest('.post').dataset.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Login first.');

      try {
        const { data: existing } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (existing?.length) {
          await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        } else {
          await supabase.from('likes').insert([{ post_id: Number(postId), user_id: user.id }]);
        }
        await updateLikeCounts();
      } catch (err) {
        console.error('Like error:', err.message);
        alert('Error: ' + err.message);
      }
    })
  );
}

// ==========================
//  LIKE COUNT HANDLER
// ==========================
async function updateLikeCounts() {
  const { data: likes, error } = await supabase.from('likes').select('post_id');
  if (error) {
    console.error('Like count error:', error.message);
    return;
  }

  const likeCounts = {};
  likes.forEach(like => {
    likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
  });

  document.querySelectorAll('.like-count').forEach(el => {
    const postId = el.id.replace('likes-', '');
    el.textContent = likeCounts[postId] || 0;
  });
}

// ==========================
//  COMMENTS (INLINE EDIT)
// ==========================
async function loadComments(postId, list) {
  const { data: { user } } = await supabase.auth.getUser();
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
      c => `
        <div class="comment" data-id="${c.id}">
          <p class="comment-text">${c.content}</p>
          <small>${c.username} • ${new Date(c.created_at).toLocaleString()}</small>
          ${user && user.id === c.user_id
            ? `<div class="comment-actions">
                 <button class="edit-comment">✏️ Edit</button>
                 <button class="delete-comment">🗑 Delete</button>
               </div>`
            : ''}
        </div>`
    )
    .join('');

  // Edit Comment Inline
  list.querySelectorAll('.edit-comment').forEach(btn =>
    btn.addEventListener('click', e => {
      const commentDiv = e.target.closest('.comment');
      const textEl = commentDiv.querySelector('.comment-text');
      const oldText = textEl.textContent;

      const textarea = document.createElement('textarea');
      textarea.value = oldText;
      textarea.className = 'comment-edit-box';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = '💾 Save';
      saveBtn.className = 'save-comment';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.className = 'cancel-comment';

      textEl.replaceWith(textarea);
      btn.parentElement.replaceChildren(saveBtn, cancelBtn);

      saveBtn.addEventListener('click', async () => {
        const newText = textarea.value.trim();
        if (!newText) return alert('Comment cannot be empty.');

        const { error } = await supabase
          .from('comments')
          .update({ content: newText })
          .eq('id', commentDiv.dataset.id)
          .eq('user_id', user.id);

        if (error) {
          alert('Failed to update comment.');
          console.error(error.message);
          return;
        }

        textarea.replaceWith(textEl);
        textEl.textContent = newText;
        loadComments(postId, list);
      });

      cancelBtn.addEventListener('click', () => {
        textarea.replaceWith(textEl);
        loadComments(postId, list);
      });
    })
  );

  // Delete Comment
  list.querySelectorAll('.delete-comment').forEach(btn =>
    btn.addEventListener('click', async e => {
      if (!confirm('Delete this comment?')) return;
      const commentId = e.target.closest('.comment').dataset.id;
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
      if (error) {
        alert('Failed to delete comment.');
        console.error(error.message);
      } else {
        e.target.closest('.comment').remove();
      }
    })
  );
}

// ==========================
//  INITIALIZE
// ==========================
document.addEventListener('DOMContentLoaded', loadPosts);
