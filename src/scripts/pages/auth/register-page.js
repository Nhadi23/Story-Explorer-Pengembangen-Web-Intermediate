import ApiService from '../../data/api.js';
import { showLoading, hideLoading, showError, showSuccess } from '../../utils/index.js';

class RegisterPage {
  async render() {
    return `
      <div class="auth-page">
        <div class="auth-container">
          <h2>Daftar di Story Explorer</h2>
          <p class="auth-subtitle">Buat akun untuk mulai berbagi cerita</p>
          
          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="register-name">Nama Lengkap</label>
              <input 
                type="text" 
                id="register-name" 
                name="name" 
                placeholder="Masukkan nama lengkap"
                required
                aria-required="true"
                autocomplete="name"
              >
              <span class="error-message" id="name-error"></span>
            </div>

            <div class="form-group">
              <label for="register-email">Email</label>
              <input 
                type="email" 
                id="register-email" 
                name="email" 
                placeholder="contoh@email.com"
                required
                aria-required="true"
                autocomplete="email"
              >
              <span class="error-message" id="email-error"></span>
            </div>

            <div class="form-group">
              <label for="register-password">Password</label>
              <input 
                type="password" 
                id="register-password" 
                name="password" 
                placeholder="Minimal 8 karakter"
                required
                aria-required="true"
                autocomplete="new-password"
              >
              <span class="error-message" id="password-error"></span>
            </div>

            <button type="submit" class="btn btn-primary">Daftar</button>
          </form>

          <p class="auth-footer">
            Sudah punya akun? <a href="#/login">Login di sini</a>
          </p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    if (form) {
      form.addEventListener('submit', (e) => this._handleRegister(e));
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

  _validateForm(name, email, password) {
    let isValid = true;

    if (!name || name.length < 3) {
      this._showFieldError('name', 'Nama minimal 3 karakter');
      isValid = false;
    }

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

  async _handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    this._clearError('name');
    this._clearError('email');
    this._clearError('password');

    if (!this._validateForm(name, email, password)) {
      return;
    }

    showLoading();
    try {
      await ApiService.register(name, email, password);
      showSuccess('Registrasi berhasil! Silakan login.');
      window.location.hash = '#/login';
    } catch (error) {
      showError(error.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      hideLoading();
    }
  }
}

export default RegisterPage;