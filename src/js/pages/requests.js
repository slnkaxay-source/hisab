import { createRequest, getSentRequests, getReceivedRequests, acceptRequest, rejectRequest } from '../api/debtRequests.js';
import { getProfileByEmail } from '../api/profiles.js';
import { showToast, showConfirmDialog } from '../utils/ui.js';
import { formatCurrency } from '../utils/helpers.js';

export async function renderRequestsView(currentUser) {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <h1 class="page-title">Requests</h1>
    <div class="section-card">
      <h2>Create a Request</h2>
      <form id="create-request-form">
        <div class="form-group">
          <label for="req-email">Receiver Email</label>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <input type="email" id="req-email" class="form-input" placeholder="Email address" required style="flex:1">
            <span id="req-email-status"></span>
          </div>
        </div>
        <div class="form-group">
          <label for="req-amount">Amount (&#8377;)</label>
          <input type="number" id="req-amount" class="form-input" placeholder="0.00" min="0.01" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="req-reason">Reason</label>
          <input type="text" id="req-reason" class="form-input" placeholder="e.g. Lunch, Movie tickets" required>
        </div>
        <div class="form-group">
          <label for="req-note">Note (optional)</label>
          <input type="text" id="req-note" class="form-input" placeholder="Any additional details">
        </div>
        <div class="form-group">
          <label for="req-due">Due Date (optional)</label>
          <input type="date" id="req-due" class="form-input">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Send Request</button>
      </form>
    </div>
    <div class="section-card">
      <div class="tabs">
        <button class="tab active" data-tab="sent">Sent</button>
        <button class="tab" data-tab="received">Received</button>
      </div>
      <div class="tab-content active" id="tab-sent"></div>
      <div class="tab-content" id="tab-received"></div>
    </div>
  `;

  const emailInput = document.getElementById('req-email');
  const statusEl = document.getElementById('req-email-status');
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

  document.getElementById('create-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const receiverEmail = document.getElementById('req-email').value.trim();
    const amount = parseFloat(document.getElementById('req-amount').value);
    const reason = document.getElementById('req-reason').value.trim();
    const note = document.getElementById('req-note').value.trim();
    const dueDate = document.getElementById('req-due').value || null;

    if (!receiverEmail || !amount || !reason) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const { data: receiverProfile } = await getProfileByEmail(receiverEmail);
    const receiverId = receiverProfile?.id || null;

    const { data, error } = await createRequest({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      receiver_email: receiverEmail,
      amount,
      reason,
      note: note || null,
      due_date: dueDate,
      is_registered: !!receiverProfile
    });

    if (error) {
      showToast(error.message || 'Failed to create request', 'error');
      console.error('Create request error:', error);
      return;
    }

    showToast('Request sent successfully', 'success');
    document.getElementById('create-request-form').reset();
    statusEl.innerHTML = '';
    loadRequests(currentUser);
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  loadRequests(currentUser);
}

async function loadRequests(currentUser) {
  const [sentRes, receivedRes] = await Promise.all([
    getSentRequests(currentUser.id),
    getReceivedRequests(currentUser.id)
  ]);

  const sent = sentRes.data || [];
  const received = receivedRes.data || [];

  renderSentList(sent);
  renderReceivedList(received, currentUser);
}

function renderSentList(requests) {
  const container = document.getElementById('tab-sent');
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#9993;</div>
        <div class="empty-state-text">No sent requests</div>
        <div class="empty-state-sub">Create a request to get started</div>
      </div>
    `;
    return;
  }

  container.innerHTML = requests.map(r => {
    const statusClass = r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : 'amber';
    return `
      <div class="request-item">
        <div class="request-header">
          <span class="request-amount">${formatCurrency(r.amount)}</span>
          <span class="status-badge ${statusClass}">${r.status}</span>
        </div>
        <div class="request-reason">${escapeHtml(r.reason)}</div>
        <div class="request-meta">To: ${escapeHtml(r.receiver_email)} &middot; ${formatDate(r.created_at)}</div>
      </div>
    `;
  }).join('');
}

function renderReceivedList(requests, currentUser) {
  const container = document.getElementById('tab-received');
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#128233;</div>
        <div class="empty-state-text">No received requests</div>
        <div class="empty-state-sub">Requests from others will appear here</div>
      </div>
    `;
    return;
  }

  container.innerHTML = requests.map(r => {
    const statusClass = r.status === 'accepted' ? 'green' : r.status === 'rejected' ? 'red' : 'amber';
    const isPending = r.status === 'pending';
    return `
      <div class="request-item" data-id="${r.id}">
        <div class="request-header">
          <span class="request-amount">${formatCurrency(r.amount)}</span>
          <span class="status-badge ${statusClass}">${r.status}</span>
        </div>
        <div class="request-reason">${escapeHtml(r.reason)}</div>
        <div class="request-meta">From: ${escapeHtml(r.sender_id)} &middot; ${formatDate(r.created_at)}${r.due_date ? ' &middot; Due: ' + formatDate(r.due_date) : ''}</div>
        ${isPending ? `
          <div class="request-actions">
            <button class="btn btn-success btn-sm accept-request" data-id="${r.id}">Accept</button>
            <button class="btn btn-danger btn-sm reject-request" data-id="${r.id}">Reject</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.accept-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const confirmed = await showConfirmDialog('Accept Request', 'Are you sure you want to accept this request?');
      if (!confirmed) return;
      await handleAcceptRequest(id, currentUser);
    });
  });

  container.querySelectorAll('.reject-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const confirmed = await showConfirmDialog('Reject Request', 'Are you sure you want to reject this request?');
      if (!confirmed) return;
      await handleRejectRequest(id, currentUser);
    });
  });
}

export async function handleCreateRequest(data) {
  const { error } = await createRequest(data);
  if (error) throw error;
}

export async function handleAcceptRequest(id, currentUser) {
  const { error } = await acceptRequest(id);
  if (error) {
    showToast('Failed to accept request', 'error');
    return;
  }
  showToast('Request accepted', 'success');
  loadRequests(currentUser);
}

export async function handleRejectRequest(id, currentUser) {
  const { error } = await rejectRequest(id);
  if (error) {
    showToast('Failed to reject request', 'error');
    return;
  }
  showToast('Request rejected', 'success');
  loadRequests(currentUser);
}

function formatDate(dateStr) {
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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
