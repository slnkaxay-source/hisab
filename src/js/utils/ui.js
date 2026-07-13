export function showToast(message, type = 'error') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    background: type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#6366f1',
    maxWidth: '90vw',
    textAlign: 'center'
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '99999', padding: '1rem'
    });

    const content = document.createElement('div');
    Object.assign(content.style, {
      background: '#fff', borderRadius: '12px', padding: '1.5rem',
      maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    });

    content.innerHTML = `
      <h3 style="margin:0 0 0.5rem;font-size:1.125rem">${title}</h3>
      <p style="margin:0 0 1.25rem;color:#64748b;font-size:0.875rem">${message}</p>
      <div style="display:flex;gap:0.75rem;justify-content:flex-end">
        <button class="btn btn-outline btn-sm" id="confirm-cancel">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-ok">Confirm</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(false);
    });

    overlay.querySelector('#confirm-ok').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    });
  });
}

export function showLoading(show) {
  const existing = document.querySelector('.loading-overlay');
  if (show) {
    if (existing) return;
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(255,255,255,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99999'
    });

    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
      width: '32px',
      height: '32px',
      border: '3px solid var(--border, #e2e8f0)',
      borderTopColor: 'var(--primary, #6366f1)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    });

    if (!document.querySelector('#loading-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'loading-spinner-style';
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
  } else {
    if (existing) existing.remove();
  }
}
