// js/auth.js
import { supabase } from './supabase.js';

// Register new user
const registerBtn = document.getElementById('register-btn');
if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });

    if (error) {
      document.getElementById('message').textContent = error.message;
    } else {
      document.getElementById('message').textContent = 'Check your email to confirm your account!';
    }
  });
}

// Log in existing user
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      document.getElementById('message').textContent = error.message;
    } else {
      window.location = 'index.html'; // redirect after login
    }
  });
}

// Logout function
export async function logout() {
  await supabase.auth.signOut();
  window.location = 'login.html';
}
