# Sistem Manajemen Alpha Chase Run (ACR 2026) - Firebase Edition 🏃💨

Aplikasi web terpadu untuk manajemen event lari **Alpha Chase Run 2026** yang telah diintegrasikan secara penuh dengan **Google Firebase (Cloud Firestore)** untuk sinkronisasi data real-time antar perangkat.

---

## 🌟 Fitur Utama

1. **Sinkronisasi Real-Time (Cloud Firestore)**:
   - Setiap pendaftaran baru, konfirmasi pembayaran, check-in, dan pengambilan logistik langsung terupdate instan di semua layar panitia dan peserta tanpa perlu refresh manual.
2. **Halaman Publik**:
   - **Info Event**: Banner hero dinamis, syarat & ketentuan, galeri foto, benefit peserta, dan Google Maps embed venue.
   - **Dashboard Publik**: Menampilkan daftar peserta terdaftar dan status pengambilan race pack / logistik.
   - **Pendaftaran Online**: Validasi NIK 16 digit, pemilihan kategori, ukuran jersey (lengan pendek/panjang), kontak darurat, dan kuota peserta real-time.
   - **Konfirmasi Pembayaran**: Pengecekan rincian tagihan, hitung mundur pembayaran 1x24 jam otomatis, dan upload bukti transfer terkompresi.
   - **Cek Status & BIB**: Pantau status verifikasi dan penerbitan nomor BIB resmi setelah check-in.
3. **Panel Admin & Panitia**:
   - **Super Admin (`super@dmin1`)**: Akses penuh ke statistik pendaftar, verifikasi pembayaran dengan preview bukti transfer, ekspor data peserta ke **PDF**, dan kustomisasi penuh event.
   - **Panitia (`p@niti4`)**: Akses khusus untuk **Race Pack Check-In** (generate Nomor BIB & QR Code Logistik, cetak struk) serta **Logistik** (checklist jersey, BIB, dan tas serut).

---

## 🚀 Panduan Setup Firebase (Cloud Firestore)

Untuk menghubungkan aplikasi ke Firebase milik Anda:

### Langkah 1: Buat Project Firebase
1. Kunjungi [Firebase Console](https://console.firebase.google.com/) dan login dengan akun Google Anda.
2. Klik **Add project** (Tambah project), masukkan nama (misalnya `ACR-Event-2026`), lalu ikuti petunjuk sampai selesai.

### Langkah 2: Aktifkan Cloud Firestore
1. Pada menu sebelah kiri di Firebase Console, buka **Build** > **Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi server database (misal: `asia-southeast2` Jakarta atau `asia-southeast1` Singapura).
4. Pada pilihan Security Rules, pilih **Start in test mode** (Mode uji coba), lalu klik **Create**.

### Langkah 3: Daftarkan Aplikasi Web & Ambil Kredensial
1. Di halaman Project Overview, klik ikon Web (`</>`) untuk mendaftarkan aplikasi.
2. Masukkan nama aplikasi (misal: `ACR Web`), lalu klik **Register app**.
3. Anda akan melihat blok konfigurasi JavaScript:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "acr-event-2026.firebaseapp.com",
     projectId: "acr-event-2026",
     storageBucket: "acr-event-2026.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```

### Langkah 4: Hubungkan ke Aplikasi
Anda dapat menghubungkan konfigurasi dengan salah satu dari dua cara berikut:

- **Cara 1 (Langsung dari Tampilan Web - Paling Mudah)**:
  1. Buka file `index.html` di browser Anda.
  2. Klik tombol **Firebase** (ikon bintang) di navbar atas atau klik **Atur Firebase Sekarang** pada banner peringatan.
  3. Salin dan tempel snippet `firebaseConfig` Anda, lalu klik **Ekstrak** dan **Simpan & Hubungkan**.
- **Cara 2 (Edit File `js/firebase-config.js`)**:
  Buka file `js/firebase-config.js` di editor teks dan isi objek `DEFAULT_FIREBASE_CONFIG` dengan konfigurasi Anda:
  ```javascript
  const DEFAULT_FIREBASE_CONFIG = {
      apiKey: "AIzaSy...",
      authDomain: "acr-event-2026.firebaseapp.com",
      projectId: "acr-event-2026",
      storageBucket: "acr-event-2026.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef"
  };
  ```

---

## 🔒 Keamanan Database (Security Rules)

Salin isi dari file `firestore.rules` ke tab **Rules** pada Firestore Database di Firebase Console agar aplikasi dapat membaca dan menulis data peserta serta pengaturan event:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /peserta/{pesertaId} {
      allow read, write: if true;
    }
    match /settings/{settingId} {
      allow read, write: if true;
    }
  }
}
```

---

## 🔑 Hak Akses & Password Default

- **Super Admin**:
  - Password: `super@dmin1`
  - Hak Akses: Dashboard, Master Data, Verifikasi/Batal Verif Bukti, Hapus Peserta, Export PDF, Pengaturan Event.
- **Panitia**:
  - Password: `p@niti4`
  - Hak Akses: Logistik & Check-In.

---

## 💻 Cara Menjalankan Aplikasi

- **Opsi 1 (Langsung)**: Klik ganda file `index.html` untuk membukanya di browser favorit Anda (Chrome, Edge, Firefox, Safari).
- **Opsi 2 (Live Server)**: Jika Anda menggunakan VS Code, klik kanan `index.html` dan pilih **Open with Live Server**.
- **Opsi 3 (Deploy Hosting)**: Aplikasi berupa berkas statis (*static web app*) murni, sehingga dapat langsung di-deploy secara gratis ke **GitHub Pages**, **Vercel**, **Netlify**, atau **Firebase Hosting**.
