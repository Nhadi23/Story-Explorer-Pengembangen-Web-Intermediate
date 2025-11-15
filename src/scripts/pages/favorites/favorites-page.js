import IDBHelper from '../../utils/idb-helper.js';
import { formatDate, showError, showSuccess } from '../../utils/index.js';

class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.filteredFavorites = [];
    this.sortBy = 'newest';
  }

  async render() {
    return `
      <div class="favorites-page">
        <section class="page-header">
          <h2>❤️ Cerita Favorit</h2>
          <p class="page-subtitle">Koleksi cerita yang Anda simpan</p>
        </section>

        <section class="favorites-controls">
          <div class="control-group">
            <label for="search-favorites">Cari:</label>
            <input 
              type="text" 
              id="search-favorites" 
              placeholder="Cari cerita..."
              class="search-input"
            >
          </div>

          <div class="control-group">
            <label for="sort-favorites">Urutkan:</label>
            <select id="sort-favorites" class="sort-select">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
            </select>
          </div>

          <button id="clear-favorites-btn" class="btn btn-secondary">
            🗑️ Hapus Semua
          </button>
        </section>

        <section class="favorites-stats">
          <div class="stat-card">
            <span class="stat-number" id="total-favorites">0</span>
            <span class="stat-label">Total Favorit</span>
          </div>
          <div class="stat-card">
            <span class="stat-number" id="filtered-count">0</span>
            <span class="stat-label">Ditampilkan</span>
          </div>
        </section>

        <section class="favorites-grid" id="favorites-grid">
          <p class="loading-text">Memuat favorit...</p>
        </section>
      </div>
    `;
  }

  async afterRender() {
    await this._loadFavorites();
    this._initializeEventListeners();
  }

  async _loadFavorites() {
    try {
      this.favorites = await IDBHelper.getAllFavorites();
      this.filteredFavorites = [...this.favorites];
      this._displayFavorites();
      this._updateStats();
    } catch (error) {
      console.error('Error loading favorites:', error);
      showError('Gagal memuat favorit');
    }
  }

  _displayFavorites() {
    const container = document.getElementById('favorites-grid');

    if (this.filteredFavorites.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <p>❤️ Belum ada cerita favorit</p>
          <p>Klik tombol favorit pada cerita untuk menyimpannya di sini</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredFavorites.map(story => `
      <article class="favorite-card" data-story-id="${story.id}">
        <img src="${story.photoUrl}" alt="${story.name}" class="favorite-image" loading="lazy">
        <div class="favorite-content">
          <h4 class="favorite-title">${story.name}</h4>
          <p class="favorite-description">${story.description}</p>
          <p class="favorite-meta">
            <span>📅 ${formatDate(story.createdAt)}</span>
            ${story.lat && story.lon ? `<span>📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</span>` : ''}
          </p>
          <button class="btn btn-remove" data-id="${story.id}">
            🗑️ Hapus
          </button>
        </div>
      </article>
    `).join('');

    // Add event listeners to remove buttons
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeFavorite(btn.dataset.id);
      });
    });
  }

  _initializeEventListeners() {
    // Search
    const searchInput = document.getElementById('search-favorites');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._filterFavorites(e.target.value);
      });
    }

    // Sort
    const sortSelect = document.getElementById('sort-favorites');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this._sortFavorites();
      });
    }

    // Clear all
    const clearBtn = document.getElementById('clear-favorites-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._clearAllFavorites();
      });
    }
  }

  _filterFavorites(query) {
    const lowerQuery = query.toLowerCase();
    this.filteredFavorites = this.favorites.filter(story => {
      return story.name.toLowerCase().includes(lowerQuery) ||
             story.description.toLowerCase().includes(lowerQuery);
    });
    this._sortFavorites();
    this._displayFavorites();
    this._updateStats();
  }

  _sortFavorites() {
    switch (this.sortBy) {
      case 'newest':
        this.filteredFavorites.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case 'oldest':
        this.filteredFavorites.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case 'name-asc':
        this.filteredFavorites.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        break;
      case 'name-desc':
        this.filteredFavorites.sort((a, b) => 
          b.name.localeCompare(a.name)
        );
        break;
    }
    this._displayFavorites();
  }

  async _removeFavorite(storyId) {
    if (!confirm('Hapus cerita dari favorit?')) {
      return;
    }

    try {
      await IDBHelper.removeFavorite(storyId);
      showSuccess('Dihapus dari favorit');
      await this._loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      showError('Gagal menghapus favorit');
    }
  }

  async _clearAllFavorites() {
    if (!confirm('Hapus semua favorit? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      const promises = this.favorites.map(story => 
        IDBHelper.removeFavorite(story.id)
      );
      await Promise.all(promises);
      showSuccess('Semua favorit dihapus');
      await this._loadFavorites();
    } catch (error) {
      console.error('Error clearing favorites:', error);
      showError('Gagal menghapus favorit');
    }
  }

  _updateStats() {
    const totalEl = document.getElementById('total-favorites');
    const filteredEl = document.getElementById('filtered-count');

    if (totalEl) totalEl.textContent = this.favorites.length;
    if (filteredEl) filteredEl.textContent = this.filteredFavorites.length;
  }
}

export default FavoritesPage;