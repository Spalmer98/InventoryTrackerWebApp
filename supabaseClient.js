/**
 * Supabase frontend: auth, image upload, and posts (text + images).
 * Usage: <script type="module" src="supabase-app.js"></script>
 *
 * 1. Set SUPABASE_URL and SUPABASE_ANON_KEY below.
 * 2. In Supabase: create table user_posts and Storage bucket (see comments).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- Config (replace with your project values) ---
const SUPABASE_URL = 'https://sfnxvbajlsjtrtjqfuge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnh2YmFqbHNqdHJ0anFmdWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDkwMzksImV4cCI6MjA4NzYyNTAzOX0.RyPSSLPSE-EWvITofFCntp03jpyuvOd8w0D18bK0wVY';
const STORAGE_BUCKET = 'user-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth ---

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// --- Storage: upload image, return path ---

export async function uploadImage(file) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;
  return path;
}

export function getImageUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// --- Database: posts (title, body, image_path) [legacy] ---

export async function createPost({ title, body, imageFile }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  let imagePath = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadImage(imageFile);
  }

  const { data, error } = await supabase
    .from('user_posts')
    .insert({
      user_id: user.id,
      title: title || '',
      body: body || '',
      image_path: imagePath,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, image_url: getImageUrl(imagePath) };
}

export async function getMyPosts() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('user_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => ({
    ...p,
    image_url: getImageUrl(p.image_path),
  }));
}

export async function deletePost(id) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const { error } = await supabase
    .from('user_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// --- Database: locations (user_id FK -> auth.users), inventory_entries (user_id, location_id FK -> locations) ---
// See supabase-inventory-setup.sql for table definitions.

/** Get or create a location by name for the current user. Returns location id. */
async function getOrCreateLocationId(userId, locationName) {
  const name = locationName.trim();
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: inserted, error } = await supabase
    .from('locations')
    .insert({ user_id: userId, name })
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

export async function createEntry({ name, description, location, imageFile }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');
  if (!name || !location) throw new Error('Item name and location are required.');

  let imagePath = null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadImage(imageFile);
  }

  const locationId = await getOrCreateLocationId(user.id, location);

  const { data, error } = await supabase
    .from('inventory_entries')
    .insert({
      user_id: user.id,
      location_id: locationId,
      name: name.trim(),
      description: (description || '').trim() || null,
      image_path: imagePath,
    })
    .select('*, locations(name)')
    .single();

  if (error) throw error;
  const row = { ...data, location: data.locations?.name ?? null, image_url: getImageUrl(imagePath) };
  delete row.locations;
  return row;
}

export async function getMyEntries() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('inventory_entries')
    .select('*, locations(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((e) => {
    const location = e.locations?.name ?? null;
    const { locations: _, ...rest } = e;
    return { ...rest, location, image_url: getImageUrl(e.image_path) };
  });
}

export async function getMyLocations() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('locations')
    .select('name')
    .eq('user_id', user.id)
    .order('name');

  if (error) throw error;
  return (data || []).map((r) => r.name).filter(Boolean);
}

export async function getEntryById(id) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('inventory_entries')
    .select('*, locations(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) return null;
  const location = data.locations?.name ?? null;
  const { locations: _, ...rest } = data;
  return { ...rest, location, image_url: getImageUrl(data.image_path) };
}

export async function deleteEntry(id) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  const { error } = await supabase
    .from('inventory_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// --- Simple UI: run when DOM is ready ---

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
        <input type="password" id="auth-password" placeholder="Password" />
        <input type="password" id="auth-password-confirm" placeholder="Confirm password" />
        <label class="toggle-label">
            <input type="checkbox" id="auth-show-passwords" /> Show passwords
        </label>
        <button type="button" id="btn-sign-in">Sign in</button>
        <button type="button" id="btn-sign-up">Sign up</button>
    </div>
    <p id="auth-message" class="message" hidden></p>
  `;

  const msgEl = container.querySelector('#auth-message');
  const emailEl = container.querySelector('#auth-email');
  const passEl = container.querySelector('#auth-password');
  const confirmEl = container.querySelector('#auth-password-confirm');
  const showCheckbox = container.querySelector('#auth-show-passwords');

  // Toggle visibility of password and confirm (checkbox controls both)
  showCheckbox.addEventListener('change', () => {
    const type = showCheckbox.checked ? 'text' : 'password';
    passEl.type = type;
    confirmEl.type = type;
  });

  container.querySelector('#btn-sign-in').onclick = async () => {
    try {
      await signIn(emailEl.value.trim(), passEl.value);
      location.reload();
    } catch (e) {
      showMessage(msgEl, e.message, true);
    }
  };
  container.querySelector('#btn-sign-up').onclick = async () => {
    const password = passEl.value;
    const confirm = confirmEl.value;
    if (!password) {
      showMessage(msgEl, 'Please enter a password.', true);
      return;
    }
    if (password !== confirm) {
      showMessage(msgEl, 'Passwords do not match.', true);
      return;
    }
    try {
      await signUp(emailEl.value.trim(), password);
      showMessage(msgEl, 'An email has been sent. Check your email to confirm sign up.');
    } catch (e) {
      showMessage(msgEl, e.message, true);
    }
  };
}

function renderPostsList(container) {
  if (!container) return;

  getMyPosts()
    .then((posts) => {
      if (!posts.length) {
        container.innerHTML = '<p>No posts yet.</p>';
        return;
      }
      container.innerHTML = posts
        .map(
          (p) => `
        <article class="post" data-id="${p.id}">
          <h3>${escapeHtml(p.title || '(no title)')}</h3>
          <p>${escapeHtml(p.body || '')}</p>
          ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="" loading="lazy" style="max-width:200px;height:auto;" />` : ''}
          <button type="button" class="btn-delete">Delete</button>
        </article>
      `
        )
        .join('');

      container.querySelectorAll('.btn-delete').forEach((btn) => {
        btn.onclick = async () => {
          const id = Number(btn.closest('.post').dataset.id);
          try {
            await deletePost(id);
            renderPostsList(container);
          } catch (err) {
            alert(err.message);
          }
        };
      });
    })
    .catch((err) => {
      container.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
    });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// --- Init UI when DOM ready ---

document.addEventListener('DOMContentLoaded', async () => {
  const authEl = document.getElementById('auth');
  const postFormEl = document.getElementById('post-form-container');
  const postsListEl = document.getElementById('posts-list');

  await renderAuth(authEl);

  const user = await getCurrentUser();
  if (user && postFormEl) {
    postFormEl.innerHTML = '<p><a href="entry.html">New Entry</a> | <a href="items.html">View Items</a></p>';
  }
  if (user && postsListEl) {
    postsListEl.innerHTML = '';
  }
});
