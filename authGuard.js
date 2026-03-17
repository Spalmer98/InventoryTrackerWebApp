/**
 * Redirect to sign-in if the user is not authenticated.
 * Load this script (type="module") on every page that requires sign-in.
 */
import { getCurrentUser } from './supabaseClient.js';

getCurrentUser().then((user) => {
  if (!user) {
    window.location.replace('index.html');
  }
});
