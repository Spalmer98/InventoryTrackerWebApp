/**
 * New Entry page: require auth, load locations into datalist, submit form to Supabase.
 */
import {
  getCurrentUser,
  getMyLocations,
  createEntry,
} from './supabaseClient.js';

const form = document.getElementById('entryForm');
const responseMessage = document.getElementById('responseMessage');
const locationsList = document.getElementById('locationsList');

function showMessage(text, isError = false) {
  if (!responseMessage) return;
  responseMessage.textContent = text;
  responseMessage.style.color = isError ? '#c00' : 'green';
  responseMessage.hidden = false;
}

async function loadLocations() {
  if (!locationsList) return;
  const fromStorage = JSON.parse(localStorage.getItem('myOptions') || '[]');
  let fromDb = [];
  try {
    const user = await getCurrentUser();
    if (user) fromDb = await getMyLocations();
  } catch (_) {}
  const combined = [...new Set([...fromDb, ...fromStorage])].sort();
  locationsList.innerHTML = combined
    .map((loc) => `<option value="${escapeHtml(loc)}">`)
    .join('');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function init() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  await loadLocations();

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('itemName')?.value?.trim();
    const description = document.getElementById('itemDescription')?.value?.trim();
    const location = document.getElementById('locations')?.value?.trim();
    const fileInput = document.getElementById('fileInput');
    const photo = fileInput?.files?.[0];

    if (!name || !location) {
      showMessage('Item name and location are required.', true);
      return;
    }

    const btn = document.getElementById('submitBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving…';
    }
    try {
      await createEntry({
        name,
        description: description || null,
        location,
        imageFile: photo || null,
      });
      const stored = JSON.parse(localStorage.getItem('myOptions') || '[]');
      if (!stored.includes(location)) {
        stored.push(location);
        localStorage.setItem('myOptions', JSON.stringify(stored));
      }
      showMessage('Entry saved. You can add another or go to Items to view.');
      form.reset();
      if (document.getElementById('imagePreview')) {
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('imagePreview').src = '#';
      }
      loadLocations();
    } catch (err) {
      showMessage(err.message || 'Failed to save entry.', true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save entry';
      }
    }
  });
}

init();
