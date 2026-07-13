import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications.js';
import { showToast, showConfirmDialog } from '../utils/ui.js';

const NOTIFICATION_ICONS = {
  new_request: { icon: '&#9993;', class: 'blue' },
  accepted: { icon: '&#10003;', class: 'green' },
  rejected: { icon: '&#10007;', class: 'red' },
  reminder: { icon: '&#9200;', class: 'amber' }
};

const DEFAULT_ICON = { icon: '&#128276;', class: 'blue' };

export async function renderNotificationsView(currentUser) {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <h1 class="page-title" style="margin:0">Notifications</h1>
      <button class="btn btn-outline btn-sm mark-all-btn" id="mark-all-read">Mark All Read</button>
    </div>
    <div class="section-card" id="notifications-list"></div>
  `;

  document.getElementById('mark-all-read')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog('Mark All Read', 'Mark all notifications as read?');
    if (!confirmed) return;

    const { error } = await markAllAsRead(currentUser.id);
    if (error) {
      showToast('Failed to mark all as read', 'error');
      return;
    }
    showToast('All notifications marked as read', 'success');
    renderNotificationsView(currentUser);
  });

  const { data: notifications, error } = await getNotifications(currentUser.id);

  if (error) {
    showToast('Failed to load notifications', 'error');
    return;
  }

  const listEl = document.getElementById('notifications-list');

  if (!notifications || notifications.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#128276;</div>
        <div class="empty-state-text">No notifications</div>
        <div class="empty-state-sub">You are all caught up</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = notifications.map(n => {
    const iconConfig = NOTIFICATION_ICONS[n.type] || DEFAULT_ICON;
    const unreadClass = n.is_read ? '' : 'unread';
    return `
      <div class="notification-item ${unreadClass}" data-id="${n.id}" data-read="${n.is_read}">
        <div class="notification-icon ${iconConfig.class}">${iconConfig.icon}</div>
        <div class="notification-content">
          <div class="notification-text">${escapeHtml(n.message)}</div>
          <div class="notification-time">${formatRelativeTime(n.created_at)}</div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      const isRead = item.dataset.read === 'true';
      if (isRead) return;

      const { error } = await markAsRead(id);
      if (error) {
        showToast('Failed to mark as read', 'error');
        return;
      }
      item.classList.remove('unread');
      item.dataset.read = 'true';
      const badgeEl = document.getElementById('sidebar-badge');
      if (badgeEl) {
        const current = parseInt(badgeEl.textContent) || 0;
        badgeEl.textContent = Math.max(0, current - 1);
        if (badgeEl.textContent === '0') {
          document.querySelectorAll('#sidebar-badge, #topbar-badge, #bottom-badge').forEach(el => el.style.display = 'none');
        }
      }
    });
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
