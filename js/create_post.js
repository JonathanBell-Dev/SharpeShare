import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('createPostForm');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert('You must be logged in to create a post.');
    window.location = 'login.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const sport = document.getElementById('sport').value.trim();
    const odds = document.getElementById('odds').value.trim();

    if (!title || !content) {
      alert('Please fill in all fields.');
      return;
    }

    // Insert post into Supabase
    const { error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          sport,
          odds,
          user_id: user.id,
          username: user.email.split('@')[0],
        },
      ]);

    if (error) {
      console.error('Error creating post:', error);
      alert('Failed to post your pick.');
      return;
    }

    alert('Post shared successfully!');
    window.location = 'index.html'; // redirect to homepage after posting
  });
});
