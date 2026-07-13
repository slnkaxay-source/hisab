import { resetPassword } from '../api/auth.js';
import { showToast, showLoading } from '../utils/ui.js';

const form = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');
const submitBtn = document.getElementById('submitBtn');
const forgotForm = document.getElementById('forgotForm');
const successState = document.getElementById('successState');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  emailError.classList.remove('visible');
  emailInput.classList.remove('error');

  if (!emailInput.value.trim()) {
    emailError.textContent = 'Email is required';
    emailError.classList.add('visible');
    emailInput.classList.add('error');
    return;
  }

  submitBtn.disabled = true;
  showLoading(true);

  const { data, error } = await resetPassword(emailInput.value.trim());

  showLoading(false);
  submitBtn.disabled = false;

  if (error) {
    showToast(error.message || 'Failed to send reset link');
    return;
  }

  forgotForm.style.display = 'none';
  successState.style.display = 'block';
});
