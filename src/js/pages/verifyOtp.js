import { supabase } from '../api/supabase.js';
import { showToast, showLoading } from '../utils/ui.js';

const emailInput = document.getElementById('email');
const otpInput = document.getElementById('otp');
const otpError = document.getElementById('otpError');
const submitBtn = document.getElementById('submitBtn');
const form = document.getElementById('verifyForm');
const resendLink = document.getElementById('resendLink');

const email = localStorage.getItem('hisab_pending_email');
if (email) {
  emailInput.value = email;
} else {
  emailInput.value = 'Not found - please sign up again';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  otpError.classList.remove('visible');
  otpInput.classList.remove('error');

  const otp = otpInput.value.trim();
  if (!otp || otp.length < 8) {
    otpError.textContent = 'Please enter the 8-digit code';
    otpError.classList.add('visible');
    otpInput.classList.add('error');
    return;
  }

  if (!supabase) {
    showToast('Supabase not configured.', 'error');
    return;
  }

  submitBtn.disabled = true;
  showLoading(true);

  const { data, error } = await supabase.auth.verifyOtp({
    email: emailInput.value,
    token: otp,
    type: 'signup'
  });

  showLoading(false);
  submitBtn.disabled = false;

  if (error) {
    showToast(error.message || 'Invalid code', 'error');
    return;
  }

  localStorage.removeItem('hisab_pending_email');
  showToast('Email verified!', 'success');
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
});

resendLink.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!supabase) {
    showToast('Supabase not configured.', 'error');
    return;
  }

  resendLink.textContent = 'Sending...';
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: emailInput.value
  });

  if (error) {
    showToast(error.message || 'Failed to resend', 'error');
    resendLink.textContent = 'Resend';
    return;
  }

  showToast('Code resent!', 'success');
  resendLink.textContent = 'Resend';
});
