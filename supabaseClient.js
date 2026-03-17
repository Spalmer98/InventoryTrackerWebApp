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

/** Signed URL for storage (works with private buckets; 1 hour expiry). Use for displaying images. */
const SIGNED_URL_EXPIRY = 3600;

export async function getImageSignedUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error) return null;
  return data?.signedUrl ?? data?.signedURL ?? null;
}

/** Get a display URL for an image: signed URL if available, otherwise public URL (for public buckets). */
export async function getImageDisplayUrl(path) {
  if (!path) return null;
  const signed = await getImageSignedUrl(path);
  if (signed) return signed;
  return getImageUrl(path);
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
  const imageUrl = imagePath ? await getImageSignedUrl(imagePath) : null;
  const row = { ...data, location: data.locations?.name ?? null, image_url: imageUrl };
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

  const entries = (data || []).map((e) => {
    const location = e.locations?.name ?? null;
    const { locations: _, ...rest } = e;
    return { ...rest, location, image_url: null };
  });
  for (const e of entries) {
    e.image_url = e.image_path ? await getImageSignedUrl(e.image_path) : null;
  }
  return entries;
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
  const imageUrl = data.image_path ? await getImageSignedUrl(data.image_path) : null;
  return { ...rest, location, image_url: imageUrl };
}

export async function updateEntry(id, { name, description, location, imageFile, currentImagePath }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');
  if (!name || !location) throw new Error('Item name and location are required.');

  let imagePath = currentImagePath ?? null;
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadImage(imageFile);
  }

  const locationId = await getOrCreateLocationId(user.id, location);

  const { data, error } = await supabase
    .from('inventory_entries')
    .update({
      name: name.trim(),
      description: (description || '').trim() || null,
      location_id: locationId,
      image_path: imagePath,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, locations(name)')
    .single();

  if (error) throw error;
  const imageUrl = data.image_path ? await getImageDisplayUrl(data.image_path) : null;
  const row = { ...data, location: data.locations?.name ?? null, image_url: imageUrl };
  delete row.locations;
  return row;
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

