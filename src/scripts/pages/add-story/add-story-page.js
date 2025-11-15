import * as maptilersdk from '@maptiler/sdk';
import ApiService from '../../data/api.js';
import CONFIG from '../../data/config.js';
import IDBHelper from '../../utils/idb-helper.js';
import { showLoading, hideLoading, showError, showSuccess } from '../../utils/index.js';

class AddStoryPage {
  constructor() {
    this.map = null;
    this.selectedLocation = null;
    this.marker = null;
    this.imageFile = null;
    this.stream = null;
  }

  async render() {
    return `
      <div class="add-story-page">
        <h2>Tambah Cerita Baru</h2>
        <p class="page-subtitle">Bagikan cerita menarik Anda dengan dunia</p>

        <form id="add-story-form" class="story-form" novalidate>
          <div class="form-row">
            <div class="form-column">
              <div class="form-group">
                <label for="story-name">Judul Cerita *</label>
                <input 
                  type="text" 
                  id="story-name" 
                  name="name" 
                  placeholder="Masukkan judul cerita"
                  required
                  aria-required="true"
                >
                <span class="error-message" id="name-error"></span>
              </div>

              <div class="form-group">
                <label for="story-description">Deskripsi *</label>
                <textarea 
                  id="story-description" 
                  name="description" 
                  rows="5"
                  placeholder="Ceritakan pengalaman Anda..."
                  required
                  aria-required="true"
                ></textarea>
                <span class="error-message" id="description-error"></span>
              </div>

              <div class="form-group">
                <label>Foto Cerita *</label>
                <div class="image-input-group">
                  <input 
                    type="file" 
                    id="story-photo" 
                    name="photo" 
                    accept="image/*"
                    aria-label="Pilih foto dari galeri"
                  >
                  <button type="button" id="camera-btn" class="btn btn-secondary">
                    📷 Ambil dari Kamera
                  </button>
                </div>
                <span class="error-message" id="photo-error"></span>
                <div id="image-preview" class="image-preview"></div>
                <video id="camera-stream" class="camera-stream" autoplay style="display: none;"></video>
                <div id="camera-controls" class="camera-controls" style="display: none;">
                  <button type="button" id="capture-btn" class="btn btn-primary">📸 Ambil Foto</button>
                  <button type="button" id="close-camera-btn" class="btn btn-secondary">❌ Tutup Kamera</button>
                </div>
              </div>

              <div class="form-group">
                <label>Lokasi Cerita *</label>
                <p class="help-text">Klik pada peta untuk memilih lokasi</p>
                <div class="location-info">
                  <span id="selected-location">Belum ada lokasi dipilih</span>
                </div>
                <span class="error-message" id="location-error"></span>
              </div>

              <button type="submit" class="btn btn-primary btn-submit">Tambah Cerita</button>
            </div>

            <div class="form-column">
              <div class="map-picker-container">
                <div id="map-picker" class="map-picker"></div>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;
  }

  async afterRender() {
    if (!ApiService.isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }

    await this._initializeMap();
    this._initializeEventListeners();
  }

  async _initializeMap() {
    try {
      // Debug: Log API key
      const apiKey = CONFIG.MAPTILER_KEY;
      console.log('API Key:', apiKey.substring(0, 10) + '...');
      
      if (!apiKey || apiKey === 'get_your_maptiler_key') {
        throw new Error('API key belum diisi!');
      }

      // Set API key
      maptilersdk.config.apiKey = apiKey;

      // Create map
      this.map = new maptilersdk.Map({
        container: 'map-picker',
        style: maptilersdk.MapStyle.STREETS,
        center: CONFIG.DEFAULT_MAP_CENTER,
        zoom: CONFIG.DEFAULT_MAP_ZOOM,
      });

      // Add controls
      this.map.addControl(new maptilersdk.NavigationControl(), 'top-right');

      // Wait for load
      await new Promise((resolve, reject) => {
        this.map.on('load', () => {
          console.log('✅ Map picker loaded successfully');
          
          // Add click handler after load
          this.map.on('click', (e) => {
            this._selectLocation(e.lngLat);
          });
          
          resolve();
        });

        this.map.on('error', (e) => {
          console.error('❌ Map error:', e);
          reject(e);
        });

        // Timeout fallback
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

  _selectLocation(lngLat) {
    this.selectedLocation = {
      lat: lngLat.lat,
      lon: lngLat.lng,
    };

    if (this.marker) {
      this.marker.remove();
    }

    this.marker = new maptilersdk.Marker({ color: '#FF0000' })
      .setLngLat([lngLat.lng, lngLat.lat])
      .addTo(this.map);

    const locationInfo = document.getElementById('selected-location');
    if (locationInfo) {
      locationInfo.textContent = `Lat: ${lngLat.lat.toFixed(6)}, Lon: ${lngLat.lng.toFixed(6)}`;
      locationInfo.classList.add('selected');
    }

    this._clearError('location');
  }

  _initializeEventListeners() {
    const form = document.getElementById('add-story-form');
    const photoInput = document.getElementById('story-photo');
    const cameraBtn = document.getElementById('camera-btn');

    if (form) {
      form.addEventListener('submit', (e) => this._handleSubmit(e));
    }

    if (photoInput) {
      photoInput.addEventListener('change', (e) => this._handleFileSelect(e));
    }

    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => this._openCamera());
    }

    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => this._clearError(input.name));
    });
  }

  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
      this._previewImage(file);
      this._clearError('photo');
    }
  }

  _previewImage(file) {
    const preview = document.getElementById('image-preview');
    const reader = new FileReader();

    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview foto">`;
      preview.style.display = 'block';
    };

    reader.readAsDataURL(file);
  }

  async _openCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      const video = document.getElementById('camera-stream');
      const controls = document.getElementById('camera-controls');
      const captureBtn = document.getElementById('capture-btn');
      const closeBtn = document.getElementById('close-camera-btn');

      video.srcObject = this.stream;
      video.style.display = 'block';
      controls.style.display = 'flex';

      captureBtn.onclick = () => this._capturePhoto();
      closeBtn.onclick = () => this._closeCamera();
    } catch (error) {
      showError('Tidak dapat mengakses kamera: ' + error.message);
    }
  }

  _capturePhoto() {
    const video = document.getElementById('camera-stream');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      this.imageFile = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      this._previewImage(this.imageFile);
      this._closeCamera();
      this._clearError('photo');
    }, 'image/jpeg');
  }

  _closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    const video = document.getElementById('camera-stream');
    const controls = document.getElementById('camera-controls');

    if (video) video.style.display = 'none';
    if (controls) controls.style.display = 'none';
  }

  _clearError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  _showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  _validateForm(name, description) {
    let isValid = true;

    if (!name || name.length < 3) {
      this._showFieldError('name', 'Judul minimal 3 karakter');
      isValid = false;
    }

    if (!description || description.length < 10) {
      this._showFieldError('description', 'Deskripsi minimal 10 karakter');
      isValid = false;
    }

    if (!this.imageFile) {
      this._showFieldError('photo', 'Foto harus dipilih');
      isValid = false;
    }

    if (!this.selectedLocation) {
      this._showFieldError('location', 'Lokasi harus dipilih di peta');
      isValid = false;
    }

    return isValid;
  }

  async _handleSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('story-name').value.trim();
    const description = document.getElementById('story-description').value.trim();

    if (!this._validateForm(name, description)) {
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', this.imageFile);
    formData.append('lat', this.selectedLocation.lat);
    formData.append('lon', this.selectedLocation.lon);

    showLoading();

    // Check if online
    if (navigator.onLine) {
      try {
        await ApiService.addStory(formData);
        showSuccess('Cerita berhasil ditambahkan!');
        window.location.hash = '#/';
      } catch (error) {
        showError('Gagal menambahkan cerita: ' + error.message);
      } finally {
        hideLoading();
      }
    } else {
      // Save to IndexedDB for later sync
      try {
        const storyData = {
          description,
          photo: this.imageFile,
          lat: this.selectedLocation.lat,
          lon: this.selectedLocation.lon,
          token: ApiService.getToken(),
          formData: formData,
        };

        await IDBHelper.addPendingStory(storyData);
        
        hideLoading();
        
        showSuccess('📡 Anda offline. Cerita akan dikirim saat online kembali.');
        
        // Register background sync if supported
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-stories');
          console.log('✅ Background sync registered');
        }
        
        window.location.hash = '#/';
      } catch (error) {
        hideLoading();
        showError('Gagal menyimpan cerita: ' + error.message);
      }
    }
  }
}

export default AddStoryPage;