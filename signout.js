/**
 * Adds a sign-out action that returns to the sign-in page.
 * Usage: include on pages that have an element with id="signOutLink".
 */
import { getCurrentUser, signOut } from './supabaseClient.js';

const link = document.getElementById('signOutLink');

async function init() {
  if (!link) return;

  const user = await getCurrentUser();
  if (!user) {
    link.style.display = 'none';
    return;
  }

  link.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await signOut();
    } finally {
      window.location.href = 'index.html';
    }
  });
}

init();

