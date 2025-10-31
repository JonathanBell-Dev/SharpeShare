// js/top_picks.js
import { supabase } from './supabase.js';

async function loadTopPicks() {
  const topDiv = document.getElementById('top-picks');

  try {
    // Fetch all posts and their like counts
    const { data: likes, error: likeError } = await supabase
      .from('likes')
      .select('post_id, created_at');
    if (likeError) throw likeError;

    const { data: posts, error: postError } = await supabase
      .from('posts')
      .select('*');
    if (postError) throw postError;

    if (!posts?.length) {
      topDiv.innerHTML = '<p>No posts available yet.</p>';
      return;
    }

    // Count likes per post (only within last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const likeCounts = {};
    likes?.forEach(like => {
      const likeDate = new Date(like.created_at);
      if (likeDate >= oneWeekAgo) {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      }
    });

    // Attach like counts to posts
    const postsWithLikes = posts.map(p => ({
      ...p,
      likes: likeCounts[p.id] || 0
    }));

    // Sort and take top 3
    const topThree = postsWithLikes
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    if (topThree.length === 0) {
      topDiv.innerHTML = '<p>No trending picks yet.</p>';
      return;
    }

    // Display top picks
    topDiv.innerHTML = topThree
      .map(
        (p, i) => `
        <div class="top-pick" data-id="${p.id}">
          <div class="rank-badge">#${i + 1}</div>
          <h4>${p.title}</h4>
          <p>${p.sport || 'N/A'} | Odds: ${p.odds || '-'}</p>
          <small>👍 ${p.likes} likes</small>
        </div>`
      )
      .join('');

    // Scroll + highlight on click
    document.querySelectorAll('.top-pick').forEach(pick => {
      pick.addEventListener('click', () => {
        const postId = pick.getAttribute('data-id');
        const postElement = document.querySelector(`.post[data-id="${postId}"]`);
        if (!postElement) {
          alert('That post is not visible yet — try refreshing the page.');
          return;
        }

        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.classList.add('highlight-post');
        setTimeout(() => postElement.classList.remove('highlight-post'), 1500);
      });
    });
  } catch (err) {
    console.error('Error loading top picks:', err.message);
    topDiv.innerHTML = '<p>Failed to load top picks.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadTopPicks);
