import ApiService from '../../data/api.js';
import { showLoading, hideLoading, showError, showSuccess } from '../../utils/index.js';

class LoginPage {
  async render() {
    return `
      <div class="auth-page">
        <div class="auth-container">
          <h2>Login ke Story Explorer</h2>
          <p class="auth-subtitle">Masuk untuk menjelajahi dan berbagi cerita</p>
          
          <form id="login-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="login-email">Email</label>
              <input 
                type="email" 
                id="login-email" 
                name="email" 
                placeholder="contoh@email.com"
                required
                aria-required="true"
                autocomplete="email"
              >
              <span class="error-message" id="email-error"></span>
            </div>

            <div class="form-group">
              <label for="login-password">Password</label>
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                placeholder="Masukkan password"
                required
                aria-required="true"
                autocomplete="current-password"
              >
              <span class="error-message" id="password-error"></span>
            </div>

            <button type="submit" class="btn btn-primary">Login</button>
          </form>

          <p class="auth-footer">
            Belum punya akun? <a href="#/register">Daftar di sini</a>
          </p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => this._handleLogin(e));
    }

    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => this._clearError(input.name));
    });
  }

  _clearError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = '';
    }
    const inputElement = document.querySelector(`[name="${fieldName}"]`);
    if (inputElement) {
      inputElement.classList.remove('error');
    }
  }

  _showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
    const inputElement = document.querySelector(`[name="${fieldName}"]`);
    if (inputElement) {
      inputElement.classList.add('error');
    }
  }

  _validateForm(email, password) {
    let isValid = true;

    if (!email) {
      this._showFieldError('email', 'Email harus diisi');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this._showFieldError('email', 'Format email tidak valid');
      isValid = false;
    }

    if (!password) {
      this._showFieldError('password', 'Password harus diisi');
      isValid = false;
    } else if (password.length < 8) {
      this._showFieldError('password', 'Password minimal 8 karakter');
      isValid = false;
    }

    return isValid;
  }

  async _handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    this._clearError('email');
    this._clearError('password');

    if (!this._validateForm(email, password)) {
      return;
    }

    showLoading();
    try {
      await ApiService.login(email, password);
      showSuccess('Login berhasil!');
      
      this._updateAuthUI();
      
      window.location.hash = '#/';
    } catch (error) {
      showError(error.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      hideLoading();
    }
  }

  _updateAuthUI() {
    const loginLink = document.getElementById('login-link');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginLink) loginLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
  }
}

export default LoginPage;