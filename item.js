/**
 * Item detail page: require auth, load one entry by id; Edit button shows form to update entry.
 */
import {
  getCurrentUser,
  getEntryById,
  getMyLocations,
  updateEntry,
} from './supabaseClient.js';

const container = document.getElementById('item-container');
const loadingEl = document.getElementById('item-loading');

function escapeHtml(s) {
  if (s == null || s === '') return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderDetailView(entry) {
  container.innerHTML = `
    <article class="item-detail">
      <h2>${escapeHtml(entry.name)}</h2>
      ${entry.image_url ? `<img src="${escapeHtml(entry.image_url)}" alt="${escapeHtml(entry.name)}" class="item-detail-img" loading="lazy" />` : '<p class="item-no-photo">No photo</p>'}
      <p class="item-location"><strong>Stored in:</strong> ${escapeHtml(entry.location || '—')}</p>
      ${entry.description ? `<p><strong>Description:</strong> ${escapeHtml(entry.description)}</p>` : ''}
      <p><button type="button" id="item-edit-btn" class="item-edit-btn">Edit</button></p>
    </article>
  `;
  container.querySelector('#item-edit-btn').onclick = () => renderEditForm(entry);
}

function renderEditForm(entry) {
  const locationsListHtml = ''; // filled async below
  container.innerHTML = `
    <form id="item-edit-form" class="item-edit-form">
      <input type="hidden" id="item-edit-id" value="${escapeHtml(entry.id)}" />
      <label for="item-edit-name">Item Name: <span class="required">*</span></label>
      <input type="text" id="item-edit-name" value="${escapeHtml(entry.name)}" required /><br><br>
      <label for="item-edit-description">Item Description (optional):</label><br>
      <textarea id="item-edit-description" rows="4" cols="50" placeholder="Enter item description">${escapeHtml(entry.description || '')}</textarea><br><br>
      <label for="item-edit-location">Location: <span class="required">*</span></label>
      <input list="item-edit-locations-list" id="item-edit-location" value="${escapeHtml(entry.location || '')}" required />
      <datalist id="item-edit-locations-list"></datalist><br><br>
      <label for="item-edit-photo">Photo (optional; leave empty to keep current):</label>
      <input type="file" accept="image/*" id="item-edit-photo" />
      <div id="item-edit-current-photo"></div><br><br>
      <button type="submit" id="item-edit-save">Save entry</button>
      <button type="button" id="item-edit-cancel">Cancel</button>
    </form>
    <p id="item-edit-message" class="message" hidden></p>
  `;

  const currentPhotoEl = document.getElementById('item-edit-current-photo');
  if (entry.image_url) {
    currentPhotoEl.innerHTML = `<p>Current photo:</p><img src="${escapeHtml(entry.image_url)}" alt="" class="item-detail-img" style="max-width:200px;" />`;
  } else {
    currentPhotoEl.innerHTML = '<p>No photo</p>';
  }

  getMyLocations().then((locations) => {
    const datalist = document.getElementById('item-edit-locations-list');
    if (datalist) {
      datalist.innerHTML = locations.map((loc) => `<option value="${escapeHtml(loc)}">`).join('');
    }
  });

  document.getElementById('item-edit-cancel').onclick = () => loadAndRender();

  document.getElementById('item-edit-form').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('item-edit-id').value;
    const name = document.getElementById('item-edit-name').value.trim();
    const description = document.getElementById('item-edit-description').value.trim();
    const location = document.getElementById('item-edit-location').value.trim();
    const fileInput = document.getElementById('item-edit-photo');
    const imageFile = fileInput?.files?.[0] || null;
    const msgEl = document.getElementById('item-edit-message');
    const saveBtn = document.getElementById('item-edit-save');

    if (!name || !location) {
      msgEl.textContent = 'Item name and location are required.';
      msgEl.style.color = '#c00';
      msgEl.hidden = false;
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    msgEl.hidden = true;
    try {
      const updated = await updateEntry(id, {
        name,
        description: description || null,
        location,
        imageFile,
        currentImagePath: entry.image_path,
      });
      msgEl.textContent = 'Entry updated.';
      msgEl.style.color = 'green';
      msgEl.hidden = false;
      setTimeout(() => renderDetailView(updated), 800);
    } catch (err) {
      msgEl.textContent = err.message || 'Update failed.';
      msgEl.style.color = '#c00';
      msgEl.hidden = false;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save entry';
    }
  };
}

async function loadAndRender() {
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
    renderDetailView(entry);
  } catch (err) {
    if (loadingEl) loadingEl.hidden = true;
    container.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

loadAndRender();
