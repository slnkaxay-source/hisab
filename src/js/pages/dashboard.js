import { supabase } from '../api/supabase.js';
import { getSession, signOut } from '../api/auth.js';
import { getSentRequests, getReceivedRequests } from '../api/debtRequests.js';
import { getContacts } from '../api/contacts.js';
import { getUnreadCount } from '../api/notifications.js';
import { getProfile } from '../api/profiles.js';
import { showToast, showLoading } from '../utils/ui.js';
import { renderFriendsView } from './friends.js';
import { renderRequestsView } from './requests.js';
import { renderNotificationsView } from './notifications.js';
import { renderProfileView } from './profile.js';

let currentUser = null;
let currentSession = null;

async function checkAuth() {
  const { data: sessionData, error: sessionError } = await getSession();
  if (sessionError || !sessionData?.session) {
    window.location.href = 'login.html';
    return false;
  }
  currentSession = sessionData.session;
  currentUser = sessionData.session.user;
  return true;
}

function updateBadge(count) {
  const elements = document.querySelectorAll('#sidebar-badge, #topbar-badge, #bottom-badge');
  elements.forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'block' : 'none';
  });
}

export async function renderDashboard() {
  showLoading(true);
  try {
    const [sentRes, receivedRes, contactsRes, unreadRes] = await Promise.all([
      getSentRequests(currentUser.id),
      getReceivedRequests(currentUser.id),
      getContacts(currentUser.id),
      getUnreadCount(currentUser.id)
    ]);

    const sent = sentRes.data || [];
    const received = receivedRes.data || [];
    const contacts = contactsRes.data || [];
    const unreadCount = unreadRes.data || 0;

    const totalToReceive = received
      .filter(r => r.status === 'accepted')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalToPay = sent
      .filter(r => r.status === 'accepted')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const pendingCount = received.filter(r => r.status === 'pending').length;
    const acceptedCount = [...sent, ...received].filter(r => r.status === 'accepted').length;

    updateBadge(unreadCount);

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <h1 class="page-title">Dashboard</h1>
      <div class="dashboard-grid">
        <div class="dashboard-card card-receive">
          <div class="card-info">
            <span class="card-number">&#8377;${totalToReceive.toFixed(2)}</span>
            <span class="card-label">Total to Receive</span>
          </div>
          <span class="card-icon">&#8593;</span>
        </div>
        <div class="dashboard-card card-pay">
          <div class="card-info">
            <span class="card-number">&#8377;${totalToPay.toFixed(2)}</span>
            <span class="card-label">Total to Pay</span>
          </div>
          <span class="card-icon">&#8595;</span>
        </div>
        <div class="dashboard-card card-pending">
          <div class="card-info">
            <span class="card-number">${pendingCount}</span>
            <span class="card-label">Pending Requests</span>
          </div>
          <span class="card-icon">&#8987;</span>
        </div>
        <div class="dashboard-card card-friends">
          <div class="card-info">
            <span class="card-number">${contacts.length}</span>
            <span class="card-label">Friends</span>
          </div>
          <span class="card-icon">&#9640;</span>
        </div>
        <div class="dashboard-card card-accepted">
          <div class="card-info">
            <span class="card-number">${acceptedCount}</span>
            <span class="card-label">Accepted</span>
          </div>
          <span class="card-icon">&#10003;</span>
        </div>
        <div class="dashboard-card card-notifications">
          <div class="card-info">
            <span class="card-number">${unreadCount}</span>
            <span class="card-label">Unread</span>
          </div>
          <span class="card-icon">&#128276;</span>
        </div>
      </div>
      <div class="quick-actions">
        <button class="quick-action-card" data-action="friends">
          <div class="quick-action-icon blue">&#9640;</div>
          <div>
            <div class="quick-action-text">Add Friend</div>
            <div class="quick-action-sub">Add someone to track debts</div>
          </div>
        </button>
        <button class="quick-action-card" data-action="requests">
          <div class="quick-action-icon green">&#9993;</div>
          <div>
            <div class="quick-action-text">Create Request</div>
            <div class="quick-action-sub">Send a debt request</div>
          </div>
        </button>
        <button class="quick-action-card" data-action="notifications">
          <div class="quick-action-icon purple">&#128276;</div>
          <div>
            <div class="quick-action-text">View Notifications</div>
            <div class="quick-action-sub">Check your updates</div>
          </div>
        </button>
      </div>
      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <ul class="activity-list" id="activity-list">
          ${renderRecentActivity([...sent, ...received])}
        </ul>
      </div>
    `;

    container.querySelectorAll('.quick-action-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'friends') navigateTo('friends');
        else if (action === 'requests') navigateTo('requests');
        else if (action === 'notifications') navigateTo('notifications');
      });
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    document.getElementById('page-content').innerHTML = '<div class="empty-state" style="padding:3rem;text-align:center"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Failed to load dashboard</div><div class="empty-state-sub">' + err.message + '</div></div>';
  } finally {
    showLoading(false);
  }
}

function renderRecentActivity(requests) {
  const recent = requests
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  if (recent.length === 0) {
    return `<li class="activity-item"><span class="activity-text" style="color:var(--text-secondary)">No recent activity</span></li>`;
  }

  return recent.map(r => {
    const dotClass = r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : 'amber';
    const label = r.status === 'accepted' ? 'Request accepted' : r.status === 'rejected' ? 'Request rejected' : 'Request sent';
    const time = formatTimeAgo(r.created_at);
    return `
      <li class="activity-item">
        <span class="activity-dot ${dotClass}"></span>
        <span class="activity-text">${label} — &#8377;${Number(r.amount).toFixed(2)} ${r.reason ? 'for ' + r.reason : ''}</span>
        <span class="activity-time">${time}</span>
      </li>
    `;
  }).join('');
}

function formatTimeAgo(dateStr) {
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
  return `${diffDay}d ago`;
}

export function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));

  document.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach(el => el.classList.add('active'));
  document.querySelectorAll(`.bottom-nav-item[data-page="${page}"]`).forEach(el => el.classList.add('active'));

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'friends': renderFriendsView(currentUser); break;
    case 'requests': renderRequestsView(currentUser); break;
    case 'notifications': renderNotificationsView(currentUser); break;
    case 'profile': renderProfileView(currentUser); break;
  }
}

export async function handleLogout() {
  const { error } = await signOut();
  if (error) {
    showToast('Failed to log out', 'error');
    return;
  }
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  document.getElementById('sidebar-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });

  document.getElementById('topbar-notifications')?.addEventListener('click', () => {
    navigateTo('notifications');
  });

  document.getElementById('topbar-avatar')?.addEventListener('click', () => {
    navigateTo('profile');
  });

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  if (!supabase) {
    document.getElementById('page-content').innerHTML = '<div class="empty-state" style="padding:3rem;text-align:center"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Supabase not connected</div><div class="empty-state-sub">Check config or refresh</div></div>';
    return;
  }

  const { data: sessionData } = await getSession();
  if (!sessionData?.session) {
    window.location.href = 'login.html';
    return;
  }
  currentSession = sessionData.session;
  currentUser = sessionData.session.user;

  navigateTo('dashboard');
});
