/**
 * Redirect to sign-in if the user is not authenticated.
 * Load this script (type="module") on every page that requires sign-in.
 * Does NOT redirect on the sign-in or sign-up pages (index.html, signup.html).
 */
import { getCurrentUser } from './supabaseClient.js';

const path = window.location.pathname || '';
const isSignInPage = path.endsWith('index.html') || path.endsWith('/');
const isSignUpPage = path.endsWith('signup.html');

if (!isSignInPage && !isSignUpPage) {
  getCurrentUser().then((user) => {
    if (!user) {
      window.location.replace('index.html');
    }
  });
}
