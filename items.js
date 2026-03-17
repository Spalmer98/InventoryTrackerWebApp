/**
 * Items page: require auth, load inventory entries from Supabase, display grouped by location.
 * Search bar filters by item name or location name (show matching items or all items in matching locations).
 */
import { getCurrentUser, getMyEntries } from './supabaseClient.js';

const container = document.getElementById('inventory-container');
const loadingEl = document.getElementById('inventory-loading');
const searchInput = document.getElementById('inventory-search');

let allEntries = [];

function escapeHtml(s) {
  if (s == null || s === '') return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/** Filter entries: include if item name OR location matches search (case-insensitive). */
function filterEntries(entries, search) {
  const q = (search || '').trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q))
  );
}

function renderInventory(entries) {
  if (!container) return;
  if (!entries.length) {
    const q = (searchInput && searchInput.value.trim()) || '';
    container.innerHTML = q
      ? '<p>No items match your search.</p>'
      : '<p>No items yet. <a href="entry.html">Add your first entry</a>.</p>';
    return;
  }

  const byLocation = {};
  for (const e of entries) {
    const loc = e.location || 'Other';
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(e);
  }
  const locations = Object.keys(byLocation).sort();

  container.innerHTML = locations
    .map(
      (loc) => `
      <section class="inventory-location" aria-label="Location: ${escapeHtml(loc)}">
        <h2>${escapeHtml(loc)}</h2>
        <ul class="inventory-list">
          ${byLocation[loc]
            .map(
              (e) => `
            <li class="inventory-item">
              <a href="item.html?id=${encodeURIComponent(e.id)}" class="inventory-item-link">
                ${e.image_url ? `<img src="${escapeHtml(e.image_url)}" alt="" class="inventory-thumb" loading="lazy" />` : ''}
                <span class="inventory-item-name">${escapeHtml(e.name)}</span>
                ${e.description ? `<span class="inventory-item-desc">${escapeHtml(e.description)}</span>` : ''}
              </a>
            </li>
          `
            )
            .join('')}
        </ul>
      </section>
    `
    )
    .join('');
}

function applySearch() {
  const filtered = filterEntries(allEntries, searchInput ? searchInput.value : '');
  renderInventory(filtered);
}

async function loadAndRender() {
  if (!container) return;
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    allEntries = await getMyEntries();
    if (loadingEl) loadingEl.hidden = true;

    applySearch();

    if (searchInput) {
      searchInput.addEventListener('input', applySearch);
      searchInput.addEventListener('keyup', applySearch);
    }
  } catch (err) {
    if (loadingEl) loadingEl.hidden = true;
    container.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

loadAndRender();
