import UrlParser from './routes/url-parser.js';
import routes from './routes/routes.js';
import ApiService from '../data/api.js';

class App {
  constructor({ content }) {
    this._content = content;
    this._initialAppShell();
  }

  _initialAppShell() {
    this._setupAuthUI();
    this._setupLogout();
    this._setupMobileMenu();
  }

  _setupAuthUI() {
    const loginLink = document.getElementById('login-link');
    const logoutBtn = document.getElementById('logout-btn');

    if (ApiService.isAuthenticated()) {
      if (loginLink) loginLink.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
      if (loginLink) loginLink.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  _setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        ApiService.logout();
        this._setupAuthUI();
        window.location.hash = '#/login';
      });
    }
  }

  _setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
      });

      const navLinks = navMenu.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  async renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url];

    if (!page) {
      this._content.innerHTML = '<div class="error-page"><h2>404 - Halaman tidak ditemukan</h2></div>';
      return;
    }

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await this._loadPage(page);
      });
    } else {
      await this._loadPage(page);
    }

    this._setupAuthUI();
  }

  async _loadPage(page) {
    const pageInstance = new page();
    this._content.innerHTML = await pageInstance.render();
    await pageInstance.afterRender();
    
    window.scrollTo(0, 0);
  }
}

export default App;