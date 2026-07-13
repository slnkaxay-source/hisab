import { getProfile, updateProfile } from '../api/profiles.js';
import { getCurrentUser, signOut } from '../api/auth.js';
import { showToast, showConfirmDialog } from '../utils/ui.js';

export async function renderProfileView(currentUser) {
  let profile = null;
  try {
    const res = await getProfile(currentUser.id);
    if (res.data) profile = res.data;
  } catch (e) {}

  const fullName = profile?.full_name || currentUser.user_metadata?.full_name || '';
  const email = currentUser.email || profile?.email || '';
  const createdAt = profile?.created_at || currentUser.created_at || new Date().toISOString();

  const container = document.getElementById('page-content');
  container.innerHTML = `
    <h1 class="page-title">Profile</h1>
    <div class="section-card">
      <div class="profile-header">
        <div class="profile-avatar-large">${getInitials(fullName || email)}</div>
        <div class="profile-info">
          <h2 id="profile-display-name">${escapeHtml(fullName || 'User')}</h2>
          <p>${escapeHtml(email)}</p>
        </div>
      </div>
      <div id="profile-fields">
        <div class="profile-field">
          <label>Email</label>
          <div class="field-value">${escapeHtml(email)}</div>
        </div>
        <div class="profile-field">
          <label>Full Name</label>
          <div id="name-field-container">
            <div class="field-value" id="name-display">${escapeHtml(fullName || 'Not set')}</div>
            <input type="text" id="name-input" class="field-input" value="${escapeHtml(fullName)}" style="display:none">
          </div>
        </div>
        <div class="profile-field">
          <label>Member Since</label>
          <div class="profile-date">${formatJoinDate(createdAt)}</div>
        </div>
      </div>
      <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
        <button class="btn btn-primary" id="edit-profile-btn">Edit Name</button>
        <button class="btn btn-outline" id="logout-profile-btn">Logout</button>
      </div>
    </div>
  `;

  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    const displayEl = document.getElementById('name-display');
    const inputEl = document.getElementById('name-input');
    const btn = document.getElementById('edit-profile-btn');

    if (btn.textContent === 'Edit Name') {
      displayEl.style.display = 'none';
      inputEl.style.display = 'block';
      inputEl.focus();
      btn.textContent = 'Save';
    } else {
      const newName = inputEl.value.trim();
      if (!newName) {
        showToast('Name cannot be empty', 'error');
        return;
      }
      handleUpdateProfile(currentUser.id, newName);
    }
  });

  document.getElementById('name-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('edit-profile-btn')?.click();
    }
  });

  document.getElementById('logout-profile-btn')?.addEventListener('click', handleLogout);
}

export async function handleUpdateProfile(userId, fullName) {
  const { error } = await updateProfile(userId, { full_name: fullName });
  if (error) {
    showToast('Failed to update profile', 'error');
    return;
  }

  showToast('Profile updated', 'success');
  document.getElementById('name-display').textContent = escapeHtml(fullName);
  document.getElementById('name-display').style.display = 'block';
  document.getElementById('name-input').style.display = 'none';
  document.getElementById('edit-profile-btn').textContent = 'Edit Name';
  document.getElementById('profile-display-name').textContent = escapeHtml(fullName);
}

export async function handleLogout() {
  const confirmed = await showConfirmDialog('Logout', 'Are you sure you want to log out?');
  if (!confirmed) return;

  const { error } = await signOut();
  if (error) {
    showToast('Failed to log out', 'error');
    return;
  }
  window.location.href = 'login.html';
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatJoinDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
