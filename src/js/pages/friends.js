import { getContacts, addContact, deleteContact, searchContacts } from '../api/contacts.js';
import { getProfileByEmail } from '../api/profiles.js';
import { showToast, showConfirmDialog } from '../utils/ui.js';

export async function renderFriendsView(currentUser) {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <h1 class="page-title">Friends</h1>
    <div class="section-card">
      <h2>Add a Friend</h2>
      <form id="add-friend-form">
        <div class="form-group">
          <label for="friend-name">Name</label>
          <input type="text" id="friend-name" class="form-input" placeholder="Full name" required>
        </div>
        <div class="form-group">
          <label for="friend-email">Email</label>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <input type="email" id="friend-email" class="form-input" placeholder="Email address" required style="flex:1">
            <span id="email-status"></span>
          </div>
        </div>
        <div class="form-group">
          <label for="friend-phone">Phone (optional)</label>
          <input type="tel" id="friend-phone" class="form-input" placeholder="Phone number">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Add Friend</button>
      </form>
    </div>
    <div class="section-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <h2 style="margin:0">Your Friends</h2>
      </div>
      <input type="text" id="search-contacts" class="search-input" placeholder="Search friends...">
      <div id="contacts-list"></div>
    </div>
  `;

  const emailInput = document.getElementById('friend-email');
  const statusEl = document.getElementById('email-status');
  let emailTimer;

  emailInput.addEventListener('input', () => {
    clearTimeout(emailTimer);
    const email = emailInput.value.trim();
    if (!email) {
      statusEl.innerHTML = '';
      return;
    }
    emailTimer = setTimeout(async () => {
      const { data: profile } = await getProfileByEmail(email);
      if (profile) {
        statusEl.innerHTML = '<span class="user-badge registered">On Hisab</span>';
      } else {
        statusEl.innerHTML = '<span class="user-badge unregistered">Not Registered</span>';
      }
    }, 400);
  });

  document.getElementById('add-friend-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('friend-name').value.trim();
    const email = document.getElementById('friend-email').value.trim();
    const phone = document.getElementById('friend-phone').value.trim();

    if (!name || !email) {
      showToast('Name and email are required', 'error');
      return;
    }

    const { data: existing } = await getContacts(currentUser.id);
    if (existing && existing.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      showToast('This friend is already in your list', 'warning');
      return;
    }

    const { data, error } = await addContact({
      user_id: currentUser.id,
      name,
      email,
      phone: phone || null
    });

    if (error) {
      showToast('Failed to add friend', 'error');
      return;
    }

    showToast('Friend added successfully', 'success');
    document.getElementById('add-friend-form').reset();
    statusEl.innerHTML = '';
    loadContacts(currentUser);
  });

  document.getElementById('search-contacts').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query) {
      loadContacts(currentUser, query);
    } else {
      loadContacts(currentUser);
    }
  });

  loadContacts(currentUser);
}

async function loadContacts(currentUser, query) {
  const listEl = document.getElementById('contacts-list');
  if (!listEl) return;

  let result;
  if (query) {
    result = await searchContacts(currentUser.id, query);
  } else {
    result = await getContacts(currentUser.id);
  }

  const contacts = result.data || [];

  if (contacts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#9640;</div>
        <div class="empty-state-text">No friends yet</div>
        <div class="empty-state-sub">Add friends to start tracking debts</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = contacts.map(c => `
    <div class="contact-item" data-id="${c.id}">
      <div class="contact-info">
        <span class="contact-name">${escapeHtml(c.name)}</span>
        <span class="contact-email">${escapeHtml(c.email)}${c.phone ? ' &middot; ' + escapeHtml(c.phone) : ''}</span>
      </div>
      <div class="contact-actions">
        <button class="btn btn-danger btn-sm delete-contact" data-id="${c.id}">Delete</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.delete-contact').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const confirmed = await showConfirmDialog('Delete Friend', 'Are you sure you want to remove this friend?');
      if (!confirmed) return;

      const { error } = await deleteContact(id);
      if (error) {
        showToast('Failed to delete friend', 'error');
        return;
      }
      showToast('Friend deleted', 'success');
      loadContacts(currentUser);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
