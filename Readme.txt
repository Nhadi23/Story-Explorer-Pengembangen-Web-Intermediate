===========================================
DEPLOYMENT WEBSITE
===========================================
Menggunakan Netlify
klik link:
https://unique-jalebi-97ade6.netlify.app/
===========================================
CARA MENJALANKAN APLIKASI
===========================================
Webpack (Dengan npm install)
-----------------------------------------
1. Install dependencies: npm install
2. Isi API key di: src/scripts/data/config.js
3. jalankan : npm run build
4. Jalankan dev server: npm run start-dev
5. Browser otomatis buka: http://localhost:8080

===========================================
TROUBLESHOOTING
===========================================

Peta tidak muncul?
- Cek API key sudah diisi dengan benar
- Pastikan format: 'string_tanpa_spasi'

Module not found (Webpack)?
- Jalankan: npm install
- Pastikan dependencies terinstall

Port sudah digunakan?
- Ganti port di webpack.dev.js
- Atau kill process yang menggunakan port

===========================================
SUPPORT & DOKUMENTASI
===========================================

MapTiler:
- Dashboard: https://cloud.maptiler.com/
- Docs: https://docs.maptiler.com/sdk-js/
- Support: https://support.maptiler.com/
