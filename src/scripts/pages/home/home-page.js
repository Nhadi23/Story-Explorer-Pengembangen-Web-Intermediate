import * as maptilersdk from '@maptiler/sdk';
import ApiService from '../../data/api.js';
import CONFIG from '../../data/config.js';
import IDBHelper from '../../utils/idb-helper.js';
import { showLoading, hideLoading, showError, formatDate } from '../../utils/index.js';

class HomePage {
  constructor() {
    this.map = null;
    this.markers = [];
    this.stories = [];
  }

  async render() {
    return `
      <div class="home-page">
        <section class="hero-section">
          <h2>Jelajahi Cerita dari Berbagai Penjuru</h2>
          <p>Temukan dan bagikan cerita menarik dari seluruh Indonesia</p>
        </section>

        <section class="map-controls">
          <div class="control-group">
            <label for="layer-select">Pilih Layer Peta:</label>
            <select id="layer-select" class="layer-select">
              <option value="streets">Streets</option>
              <option value="satellite">Satellite</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>
          <div class="control-group">
            <label>
              <input type="checkbox" id="sync-map-list" checked>
              Sinkronisasi Peta & List
            </label>
          </div>
        </section>

        <section class="content-section">
          <div class="map-container">
            <div id="map" class="map"></div>
          </div>

          <div class="stories-container">
            <h3>Daftar Cerita</h3>
            <div id="stories-list" class="stories-list">
              <p class="loading-text">Memuat cerita...</p>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    if (!ApiService.isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }

    await this._initializeMap();
    await this._loadStories();
    this._initializeEventListeners();
  }

  async _initializeMap() {
    try {
      const apiKey = CONFIG.MAPTILER_KEY;
      console.log('API Key:', apiKey.substring(0, 10) + '...');
      
      if (!apiKey || apiKey === 'get_your_maptiler_key') {
        throw new Error('API key belum diisi!');
      }

      maptilersdk.config.apiKey = apiKey;

      this.map = new maptilersdk.Map({
        container: 'map',
        style: maptilersdk.MapStyle.STREETS,
        center: CONFIG.DEFAULT_MAP_CENTER,
        zoom: CONFIG.DEFAULT_MAP_ZOOM,
      });

      this.map.addControl(new maptilersdk.NavigationControl(), 'top-right');

      await new Promise((resolve, reject) => {
        this.map.on('load', () => {
          console.log('✅ Map loaded successfully');
          resolve();
        });
        
        this.map.on('error', (e) => {
          console.error('❌ Map error:', e);
          reject(e);
        });

        setTimeout(() => {
          reject(new Error('Map load timeout'));
        }, 10000);
      });

    } catch (error) {
      console.error('❌ Map initialization error:', error);
      console.error('Error details:', error.message);
      showError(`Gagal memuat peta: ${error.message}. Periksa API key Anda.`);
    }
  }

  async _loadStories() {
    showLoading();
    try {
      if (navigator.onLine) {
        const response = await ApiService.getStories(1);
        this.stories = response.listStory || [];
        await IDBHelper.cacheStories(this.stories);
      } else {
        console.log('📡 Offline: Loading from cache');
        this.stories = await IDBHelper.getCachedStories();
      }

      this._displayStories();
      this._addMarkersToMap();
    } catch (error) {
      console.error('Error loading stories:', error);
      
      try {
        console.log('Loading from cache...');
        this.stories = await IDBHelper.getCachedStories();
        this._displayStories();
        this._addMarkersToMap();
        showError('Menampilkan data dari cache (offline)');
      } catch (cacheError) {
        showError('Gagal memuat cerita: ' + error.message);
      }
    } finally {
      hideLoading();
    }
  }

  async _displayStories() {
    const container = document.getElementById('stories-list');
    
    if (this.stories.length === 0) {
      container.innerHTML = '<p class="no-data">Belum ada cerita tersedia</p>';
      return;
    }

    const favoriteChecks = await Promise.all(
      this.stories.map(story => IDBHelper.isFavorite(story.id))
    );

    container.innerHTML = this.stories.map((story, index) => `
      <article class="story-card" data-story-id="${story.id}" data-lat="${story.lat}" data-lon="${story.lon}" tabindex="0" role="article">
        <img src="${story.photoUrl}" alt="${story.name}" class="story-image" loading="lazy">
        <div class="story-content">
          <div class="story-header">
            <h4 class="story-title">${story.name}</h4>
            <button class="btn-favorite ${favoriteChecks[index] ? 'active' : ''}" 
                    data-story-id="${story.id}" 
                    data-story='${JSON.stringify(story).replace(/'/g, "&apos;")}' 
                    aria-label="Toggle favorite">
              ${favoriteChecks[index] ? '❤️' : '🤍'}
            </button>
          </div>
          <p class="story-description">${story.description}</p>
          <p class="story-meta">
            <span>📅 ${formatDate(story.createdAt)}</span>
            ${story.lat && story.lon ? `<span>📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</span>` : ''}
          </p>
        </div>
      </article>
    `).join('');

    const storyCards = container.querySelectorAll('.story-card');
    storyCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-favorite')) {
          this._handleStoryCardClick(card);
        }
      });
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._handleStoryCardClick(card);
        }
      });
    });

    const favoriteButtons = container.querySelectorAll('.btn-favorite');
    favoriteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleFavorite(btn);
      });
    });
  }

  async _toggleFavorite(button) {
    const storyId = button.dataset.storyId;
    const storyData = JSON.parse(button.dataset.story.replace(/&apos;/g, "'"));

    try {
      const isFav = await IDBHelper.isFavorite(storyId);

      if (isFav) {
        await IDBHelper.removeFavorite(storyId);
        button.textContent = '🤍';
        button.classList.remove('active');
      } else {
        await IDBHelper.addFavorite(storyData);
        button.textContent = '❤️';
        button.classList.add('active');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Gagal menyimpan favorit');
    }
  }

  _handleStoryCardClick(card) {
    const syncEnabled = document.getElementById('sync-map-list')?.checked;
    if (!syncEnabled) return;

    const lat = parseFloat(card.dataset.lat);
    const lon = parseFloat(card.dataset.lon);
    const storyId = card.dataset.storyId;

    if (lat && lon && this.map) {
      this.map.flyTo({
        center: [lon, lat],
        zoom: 12,
        duration: 2000,
      });

      this._highlightMarker(storyId);

      document.querySelectorAll('.story-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    }
  }

  _addMarkersToMap() {
    if (!this.map) return;

    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    this.stories.forEach(story => {
      if (story.lat && story.lon) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.dataset.storyId = story.id;
        el.innerHTML = '📍';
        el.style.cursor = 'pointer';
        el.style.fontSize = '2rem';

        const popup = new maptilersdk.Popup({ offset: 25 })
          .setHTML(`
            <div class="popup-content">
              <img src="${story.photoUrl}" alt="${story.name}" class="popup-image" style="width: 100%; height: 150px; object-fit: cover;">
              <h4 style="padding: 0.5rem; margin: 0;">${story.name}</h4>
              <p style="padding: 0 0.5rem 0.5rem; margin: 0; font-size: 0.875rem;">${story.description.substring(0, 100)}...</p>
            </div>
          `);

        const marker = new maptilersdk.Marker({ element: el })
          .setLngLat([story.lon, story.lat])
          .setPopup(popup)
          .addTo(this.map);

        el.addEventListener('click', () => {
          this._highlightMarker(story.id);
          this._scrollToStoryCard(story.id);
        });

        this.markers.push(marker);
      }
    });
  }

  _highlightMarker(storyId) {
    document.querySelectorAll('.custom-marker').forEach(m => {
      m.classList.remove('active');
    });

    const activeMarker = document.querySelector(`.custom-marker[data-story-id="${storyId}"]`);
    if (activeMarker) {
      activeMarker.classList.add('active');
    }
  }

  _scrollToStoryCard(storyId) {
    const syncEnabled = document.getElementById('sync-map-list')?.checked;
    if (!syncEnabled) return;

    const card = document.querySelector(`.story-card[data-story-id="${storyId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      card.classList.add('active');
      
      document.querySelectorAll('.story-card').forEach(c => {
        if (c !== card) c.classList.remove('active');
      });
    }
  }

  _initializeEventListeners() {
    const layerSelect = document.getElementById('layer-select');
    if (layerSelect) {
      layerSelect.addEventListener('change', (e) => {
        this._changeMapLayer(e.target.value);
      });
    }
  }

  _changeMapLayer(layer) {
    if (!this.map) return;

    const layerStyles = {
      streets: maptilersdk.MapStyle.STREETS,
      satellite: maptilersdk.MapStyle.SATELLITE,
      outdoor: maptilersdk.MapStyle.OUTDOOR,
    };

    if (layerStyles[layer]) {
      this.map.setStyle(layerStyles[layer]);
      
      this.map.once('styledata', () => {
        setTimeout(() => {
          this._addMarkersToMap();
        }, 500);
      });
    }
  }
}

export default HomePage;