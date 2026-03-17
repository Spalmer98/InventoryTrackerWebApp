/**
 * Sign-in page only: renders the auth form and "New Entry | View Inventory" when signed in.
 * Load this only on index.html so signup.html is never affected.
 */
import { getCurrentUser, signIn, signOut } from './supabaseClient.js';

function showMessage(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.className = isError ? 'message error' : 'message';
  el.hidden = false;
}

async function renderAuth(container) {
  if (!container) return;

  const user = await getCurrentUser();
  if (user) {
    container.innerHTML = `
      <p>Signed in as <strong>${user.email}</strong></p>
      <button type="button" id="btn-sign-out">Sign out</button>
    `;
    container.querySelector('#btn-sign-out').onclick = () => {
      signOut();
      location.reload();
    };
    return;
  }

  container.innerHTML = `
    <div id="auth-form">
        <input type="email" id="auth-email" placeholder="Email" />
        <div class="auth-password-row">
            <input type="password" id="auth-password" placeholder="Password" />
            <label class="toggle-label">
                <input type="checkbox" id="auth-show-passwords" /> Show
            </label>
        </div>
        <div id="auth-buttons">
            <button type="button" id="btn-sign-in">Sign in</button>
            <a href="signup.html" class="auth-link" id="auth-signup-link">Sign up</a>
        </div>
    </div>
    <p id="auth-message" class="message" hidden></p>
  `;

  const msgEl = container.querySelector('#auth-message');
  const emailEl = container.querySelector('#auth-email');
  const passEl = container.querySelector('#auth-password');
  const showCheckbox = container.querySelector('#auth-show-passwords');
  const signUpLink = container.querySelector('#auth-signup-link');

  if (signUpLink) {
    signUpLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'signup.html';
    });
  }

  showCheckbox.addEventListener('change', () => {
    passEl.type = showCheckbox.checked ? 'text' : 'password';
  });

  container.querySelector('#btn-sign-in').onclick = async () => {
    try {
      await signIn(emailEl.value.trim(), passEl.value);
      location.reload();
    } catch (e) {
      showMessage(msgEl, e.message, true);
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const authEl = document.getElementById('auth');
  const postFormEl = document.getElementById('post-form-container');
  const postsListEl = document.getElementById('posts-list');

  await renderAuth(authEl);

  const user = await getCurrentUser();
  if (user && postFormEl) {
    postFormEl.innerHTML = '<p><a href="entry.html">New Entry</a> | <a href="items.html">View Inventory</a></p>';
  }
  if (user && postsListEl) {
    postsListEl.innerHTML = '';
  }
});
