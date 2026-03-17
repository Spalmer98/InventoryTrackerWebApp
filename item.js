/**
 * Item detail page: require auth, load one entry by id from query string.
 */
import { getCurrentUser, getEntryById } from './supabaseClient.js';

const container = document.getElementById('item-container');
const loadingEl = document.getElementById('item-loading');

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

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    if (loadingEl) loadingEl.hidden = true;
    container.innerHTML = '<p>No item selected. <a href="items.html">View your items</a>.</p>';
    return;
  }

  try {
    const entry = await getEntryById(id);
    if (loadingEl) loadingEl.hidden = true;
    if (!entry) {
      container.innerHTML = '<p>Item not found. <a href="items.html">Back to Items</a>.</p>';
      return;
    }
    container.innerHTML = `
      <article class="item-detail">
        <h2>${escapeHtml(entry.name)}</h2>
        <p><strong>Location:</strong> ${escapeHtml(entry.location)}</p>
        ${entry.description ? `<p><strong>Description:</strong> ${escapeHtml(entry.description)}</p>` : ''}
        ${entry.image_url ? `<img src="${escapeHtml(entry.image_url)}" alt="" class="item-detail-img" loading="lazy" />` : ''}
      </article>
    `;
  } catch (err) {
    if (loadingEl) loadingEl.hidden = true;
    container.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

render();
