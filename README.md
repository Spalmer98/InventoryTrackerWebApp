# Inventory Tracker

Web app for storing and viewing inventory: sign in with Supabase Auth, add entries (name, optional description and photo, required location), and view items organized by location.

## Features

- **Sign up / Sign in** – Create an account or sign in (landing: `index.html`; sign up: `signup.html`).
- **New Entry** (`entry.html`) – Item name (required), description (optional), photo (optional), location (required; type or pick from previous locations). Saves to Supabase.
- **Items** (`items.html`) – List of your entries grouped by location; each item links to a detail view.
- **Item detail** (`item.html?id=...`) – Single entry view with name, location, description, and photo.

## Per-user data (privacy)

Every **entry** and **location** is tied to the signed-in user. Only that user can see or change their data; no one can see another user’s entries or locations.

- **Database**: Row Level Security (RLS) on `locations` and `inventory_entries` restricts all reads/writes to rows where `user_id = auth.uid()`.
- **App**: All API calls use the current user’s id (from Supabase Auth) and only load or modify that user’s records.
- **Storage**: Entry photos are stored under the user’s folder (`user_id/...`). RLS policies on `storage.objects` limit uploads and access to the owner’s folder.

## Supabase setup

1. In the [Supabase Dashboard](https://supabase.com/dashboard): SQL Editor → run the contents of `supabase-inventory-setup.sql` to create the `locations` and `inventory_entries` tables, their RLS policies, and storage policies for the `user-images` bucket.
2. In Storage, create a bucket named `user-images` (for entry photos) if it doesn’t exist.
3. Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabaseClient.js` set to your project.

## Run locally

Open `index.html` in a browser (or use a local server to avoid CORS with Supabase). Sign in, then use **New Entry** to add items and **Items** to view them by location.
