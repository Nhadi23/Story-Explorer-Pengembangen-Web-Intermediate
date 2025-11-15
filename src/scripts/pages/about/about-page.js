class AboutPage {
  async render() {
    return `
      <div class="about-page">
        <section class="about-hero">
          <h2>Tentang Story Explorer</h2>
          <p class="about-subtitle">Platform berbagi cerita dengan visualisasi peta interaktif</p>
        </section>

        <section class="about-content">
          <article class="about-section">
            <h3>Apa itu Story Explorer?</h3>
            <p>
              Story Explorer adalah aplikasi web yang memungkinkan Anda untuk berbagi dan 
              menjelajahi cerita dari berbagai lokasi di Indonesia. Setiap cerita ditampilkan 
              pada peta interaktif sehingga Anda dapat melihat dari mana cerita tersebut berasal.
            </p>
          </article>

          <article class="about-section">
            <h3>Fitur Utama</h3>
            <ul class="feature-list">
              <li> <strong>Peta Interaktif</strong> - Visualisasi cerita pada peta digital dengan marker</li>
              <li> <strong>Multiple Layer</strong> - Pilih berbagai jenis tampilan peta (Streets, Satellite, Outdoor)</li>
              <li> <strong>Tambah Cerita</strong> - Bagikan cerita Anda dengan foto dan lokasi</li>
              <li> <strong>Kamera Langsung</strong> - Ambil foto langsung dari kamera device Anda</li>
              <li> <strong>Sinkronisasi</strong> - Sinkronisasi antara daftar cerita dan peta</li>
              <li> <strong>Transisi Halus</strong> - Navigasi antar halaman dengan animasi transisi</li>
            </ul>
          </article>

          <article class="about-section">
            <h3>Teknologi yang Digunakan</h3>
            <ul class="tech-list">
              <li>Vanilla JavaScript (ES6+)</li>
              <li>MapTiler untuk tile layer</li>
              <li>Story API dari Dicoding</li>
            </ul>
          </article>

          <article class="about-section">
            <h3>Aksesibilitas</h3>
            <p>
              Aplikasi ini dibangun dengan memperhatikan aksesibilitas, termasuk:
            </p>
            <ul>
              <li>Semantic HTML untuk struktur yang jelas</li>
              <li>Label pada semua input form</li>
              <li>Alt text pada semua gambar</li>
              <li>Keyboard navigation support</li>
              <li>Skip to content link</li>
              <li>Responsive design untuk berbagai ukuran layar</li>
            </ul>
          </article>
        </section>
      </div>
    `;
  }

  async afterRender() {
  }
}

export default AboutPage;