import { signIn } from '../api/auth.js';
import { supabase } from '../api/supabase.js';
import { showToast, showLoading } from '../utils/ui.js';

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const submitBtn = document.getElementById('submitBtn');
const passwordToggle = document.getElementById('passwordToggle');

passwordToggle.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  passwordToggle.textContent = type === 'password' ? '👁' : '👁‍🗨';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  emailError.classList.remove('visible');
  passwordError.classList.remove('visible');
  emailInput.classList.remove('error');
  passwordInput.classList.remove('error');

  let valid = true;

  if (!emailInput.value.trim()) {
    emailError.textContent = 'Email is required';
    emailError.classList.add('visible');
    emailInput.classList.add('error');
    valid = false;
  }

  if (!passwordInput.value) {
    passwordError.textContent = 'Password is required';
    passwordError.classList.add('visible');
    passwordInput.classList.add('error');
    valid = false;
  }

  if (!valid) return;

  if (!supabase) {
    showToast('Supabase not configured. Please check config.', 'error');
    return;
  }

  submitBtn.disabled = true;
  showLoading(true);

  const { data, error } = await signIn(emailInput.value.trim(), passwordInput.value);

  showLoading(false);
  submitBtn.disabled = false;

  if (error) {
    showToast(error.message || 'Invalid email or password', 'error');
    return;
  }

  window.location.href = 'dashboard.html';
});
