import { signUp } from '../api/auth.js';
import { supabase } from '../api/supabase.js';
import { showToast, showLoading } from '../utils/ui.js';

const form = document.getElementById('signupForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const fullNameError = document.getElementById('fullNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const submitBtn = document.getElementById('submitBtn');
const strengthBarFill = document.getElementById('strengthBarFill');
const strengthLabel = document.getElementById('strengthLabel');
const passwordToggle = document.getElementById('passwordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

passwordToggle.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  passwordToggle.textContent = type === 'password' ? '👁' : '👁‍🗨';
});

confirmPasswordToggle.addEventListener('click', () => {
  const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
  confirmPasswordInput.type = type;
  confirmPasswordToggle.textContent = type === 'password' ? '👁' : '👁‍🗨';
});

function getPasswordStrength(password) {
  if (!password) return { level: '', label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', label: 'Weak' };
  if (score <= 4) return { level: 'medium', label: 'Medium' };
  return { level: 'strong', label: 'Strong' };
}

passwordInput.addEventListener('input', () => {
  const { level, label } = getPasswordStrength(passwordInput.value);

  strengthBarFill.className = 'strength-bar-fill';
  if (level) {
    strengthBarFill.classList.add(level);
  }

  strengthLabel.textContent = label ? `Password strength: ${label}` : '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  fullNameError.classList.remove('visible');
  emailError.classList.remove('visible');
  passwordError.classList.remove('visible');
  confirmPasswordError.classList.remove('visible');
  fullNameInput.classList.remove('error');
  emailInput.classList.remove('error');
  passwordInput.classList.remove('error');
  confirmPasswordInput.classList.remove('error');

  let valid = true;

  if (!fullNameInput.value.trim()) {
    fullNameError.textContent = 'Full name is required';
    fullNameError.classList.add('visible');
    fullNameInput.classList.add('error');
    valid = false;
  }

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
  } else if (passwordInput.value.length < 6) {
    passwordError.textContent = 'Password must be at least 6 characters';
    passwordError.classList.add('visible');
    passwordInput.classList.add('error');
    valid = false;
  }

  if (!confirmPasswordInput.value) {
    confirmPasswordError.textContent = 'Please confirm your password';
    confirmPasswordError.classList.add('visible');
    confirmPasswordInput.classList.add('error');
    valid = false;
  } else if (passwordInput.value !== confirmPasswordInput.value) {
    confirmPasswordError.textContent = 'Passwords do not match';
    confirmPasswordError.classList.add('visible');
    confirmPasswordInput.classList.add('error');
    valid = false;
  }

  if (!valid) return;

  if (!supabase) {
    showToast('Supabase not configured. Please check config.', 'error');
    return;
  }

  submitBtn.disabled = true;
  showLoading(true);

  const { data, error } = await signUp(emailInput.value.trim(), passwordInput.value, fullNameInput.value.trim());

  showLoading(false);
  submitBtn.disabled = false;

  if (error) {
    showToast(error.message || 'Something went wrong', 'error');
    return;
  }

  localStorage.setItem('hisab_pending_email', emailInput.value.trim());
  showToast('Verification code sent!', 'success');
  setTimeout(() => {
    window.location.href = 'verify-otp.html';
  }, 1500);
});
