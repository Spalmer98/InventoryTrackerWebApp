# Inventory Tracker

Web app for storing and viewing inventory: sign in with Supabase Auth, add entries (name, optional description and photo, required location), and view items organized by location.

## Features

- **Sign up / Sign in** – Create an account or sign in (landing: `index.html`).
- **New Entry** (`entry.html`) – Item name (required), description (optional), photo (optional), location (required; type or pick from previous locations). Saves to Supabase.
- **Items** (`items.html`) – List of your entries grouped by location; each item links to a detail view.
- **Item detail** (`item.html?id=...`) – Single entry view with name, location, description, and photo.

## Supabase setup

1. In the [Supabase Dashboard](https://supabase.com/dashboard): SQL Editor → run the contents of `supabase-inventory-setup.sql` to create the `inventory_entries` table and RLS policies.
2. In Storage, ensure a bucket named `user-images` exists (for entry photos). The app uses the same bucket as in `supabaseClient.js` (`STORAGE_BUCKET`).
3. Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabaseClient.js` set to your project.

## Run locally

Open `index.html` in a browser (or use a local server to avoid CORS with Supabase). Sign in, then use **New Entry** to add items and **Items** to view them by location.
