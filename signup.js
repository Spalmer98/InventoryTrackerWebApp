/**
 * Sign-up page: create a new user in the database (Supabase Auth stores email and password).
 */
import { getCurrentUser, signUp } from './supabaseClient.js';

const form = document.getElementById('signup-form');
const msgEl = document.getElementById('auth-message');
const emailEl = document.getElementById('auth-email');
const passEl = document.getElementById('auth-password');
const confirmEl = document.getElementById('auth-password-confirm');
const showCheckbox = document.getElementById('auth-show-passwords');

function showMessage(text, isError = false) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = isError ? 'message error' : 'message';
  msgEl.hidden = false;
}

// If already signed in, redirect to home (so they don't create a second account)
getCurrentUser().then((user) => {
  if (user) {
    window.location.replace('index.html');
  }
}).catch(() => {
  // Ignore auth errors so sign-up page still loads for new users
});

if (showCheckbox) {
  showCheckbox.addEventListener('change', () => {
    const type = showCheckbox.checked ? 'text' : 'password';
    passEl.type = type;
    confirmEl.type = type;
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();
    const password = passEl.value;
    const confirm = confirmEl.value;

    if (!password) {
      showMessage('Please enter a password.', true);
      return;
    }
    if (password !== confirm) {
      showMessage('Passwords do not match.', true);
      return;
    }

    const btn = document.getElementById('btn-sign-up');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating account…';
    }
    try {
      await signUp(email, password);
      showMessage('Account created. Check your email to confirm, then sign in.');
      form.reset();
    } catch (err) {
      showMessage(err.message || 'Sign up failed.', true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign up';
      }
    }
  });
}
