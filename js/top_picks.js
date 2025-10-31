// js/top_picks.js
import { supabase } from './supabase.js';

async function loadTopPicks() {
  try {
    // Get start of the current week (Monday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    // Get all likes this week
    const { data: likes, error: likeError } = await supabase
      .from('likes')
      .select('post_id, created_at');

    if (likeError) throw likeError;

    // Count likes for posts within the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentLikes = likes.filter(like => new Date(like.created_at) >= oneWeekAgo);
    const likeCounts = {};
    recentLikes.forEach(like => {
      likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
    });

    // Sort post IDs by like count
    const sortedPosts = Object.entries(likeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedPosts.length === 0) {
      document.getElementById('top-picks').innerHTML = '<p>No trending picks yet.</p>';
      return;
    }

    // Fetch post details
    const ids = sortedPosts.map(([id]) => Number(id));
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .select('*')
      .in('id', ids);

    if (postError) throw postError;

    // Sort again by likes for display order
    const postsByLikes = posts.sort(
      (a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0)
    );

    // Display top picks
    const topPicksDiv = document.getElementById('top-picks');
    topPicksDiv.innerHTML = postsByLikes
      .map(
        p => `
        <div class="top-pick">
          <h4>${p.title}</h4>
          <p>${p.sport} | Odds: ${p.odds}</p>
          <small>👍 ${likeCounts[p.id]} likes</small>
        </div>`
      )
      .join('');
  } catch (err) {
    console.error('Error loading top picks:', err.message);
    document.getElementById('top-picks').innerHTML = '<p>Failed to load top picks.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadTopPicks);
