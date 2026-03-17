/**
 * Items page: require auth, load inventory entries from Supabase, display grouped by location.
 */
import { getCurrentUser, getMyEntries } from './supabaseClient.js';

const container = document.getElementById('inventory-container');
const loadingEl = document.getElementById('inventory-loading');

function escapeHtml(s) {
  if (s == null || s === '') return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function render() {
  if (!container) return;
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const entries = await getMyEntries();
    if (loadingEl) loadingEl.hidden = true;

    if (!entries.length) {
      container.innerHTML = '<p>No items yet. <a href="entry.html">Add your first entry</a>.</p>';
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
  } catch (err) {
    if (loadingEl) loadingEl.hidden = true;
    container.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

render();
