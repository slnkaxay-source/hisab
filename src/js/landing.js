function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
}

function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach((openItem) => {
        openItem.classList.remove('active');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  links.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });
}

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });
}

function initToast() {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  window.showToast = (message, type = 'info', duration = 4000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };
}

function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  if (!overlay || !closeBtn) return;

  window.openModal = (content, actions = []) => {
    document.getElementById('modalBody').innerHTML = content;
    const actionsContainer = document.getElementById('modalActions');
    actionsContainer.innerHTML = '';
    actions.forEach(({ text, type, onClick }) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-${type || 'primary'}`;
      btn.textContent = text;
      btn.addEventListener('click', onClick);
      actionsContainer.appendChild(btn);
    });
    overlay.classList.add('active');
  };

  window.closeModal = () => {
    overlay.classList.remove('active');
  };

  closeBtn.addEventListener('click', window.closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.closeModal();
  });
}

function initLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  window.showLoading = () => overlay.classList.add('active');
  window.hideLoading = () => overlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initFaqAccordion();
  initMobileNav();
  initSmoothScroll();
  initNavbarScroll();
  initToast();
  initModal();
  initLoadingOverlay();
});
