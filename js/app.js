/**
 * Alpha Chase Run (ACR 2026) - Application Logic
 * Terintegrasi dengan Firebase Cloud Firestore untuk Sinkronisasi Real-Time
 */

// =====================================================================
// STATE APLIKASI
// =====================================================================
const State = {
    role: 'guest',
    currentMasterList: [],
    currentHistoryList: [],
    activePage: 'info',
    unsubscribePeserta: null,
    unsubscribeSettings: null,
    settings: {
        judul: 'Alpha Chase Run',
        deskripsi: 'STRENGHT * HONOR * BROTHERHOOD',
        aturan: `         PERATURAN PESERTA\nPeserta wajib membaca dan memahami Pemberitahuan Penting, Syarat dan Ketentuan, serta Peraturan Lomba sebelum mengikuti kegiatan.\nDan peserta juga diwajibkan memastikan kondisi kesehatannya dalam keadaan baik. Apabila memiliki keraguan terkait kondisi kesehatan, peserta disarankan untuk berkonsultasi dengan dokter sebelum mengikuti lomba.\nSyarat dan Ketentuan serta Peraturan Lomba dibuat untuk menjamin kelancaran penyelenggaraan dan keselamatan seluruh peserta. Penyelenggara berhak menolak pendaftaran peserta yang memberikan informasi tidak benar, tidak menyelesaikan pembayaran sesuai ketentuan, atau tidak memenuhi persyaratan yang telah ditetapkan.\n        PERATURAN PENDAFTARAN\nPeserta wajib menggunakan jersey resmi event ACR selama mengikuti lomba. Jika peserta tidak menggunakan jersey resmi Alpha Chase Run (ACR), maka panitia berhak menolak peserta mengikuti lomba atau mendiskualifikasi peserta dari perlombaan.\nKhusus kategori Fun Run Putri wajib mengenakan pakaian olahraga yang menutup aurat, longgar, dan tidak transparan. Kategori Fun Run Putri bersifat non-kompetitif dan tidak terdapat podium pemenang.\nNomor bib wajib dipasang di bagian depan dan terlihat jelas selama lomba berlangsung.\nPeserta wajib mengikuti rute resmi lomba dan mematuhi arahan panitia, marshal, petugas keamanan, dan tim medis.\nPeserta yang terbukti memotong jalur (cutting route), melakukan tindakan tidak sportif, atau melanggar aturan dapat didiskualifikasi.\nPeserta dilarang ditemani pihak lain yang tidak terdaftar sebagai peserta resmi.\nBinatang peliharaan, sepeda, stroller, skateboard, sepatu roda, dan alat transportasi lainnya tidak diperbolehkan berada di rute lomba.\nPencatatan waktu dilakukan secara manual menggunakan sistem gun time (waktu flag off/start).\nApabila keberatan hasil lomba hanya dapat diajukan maksimal 15 menit setelah hasil diumumkan atau hadiah diberikan.\nPenyelenggara berhak mendiskualifikasi peserta yang memberikan data palsu atau melanggar ketentuan lomba.\nDalam kondisi force majeure seperti cuaca ekstrem, bencana, atau kondisi berbahaya lainnya, lomba dapat ditunda, dihentikan, atau dibatalkan oleh Penyelenggara.\nHarga Early Bird Rp. 25.000 dan hanya berlaku untuk 100 pendaftar pertama, apabila belum melakukan pembayaran selama 1 x 24 jam maka Early Bird akan otomatis terhapus, dan peserta wajib daftar kembali\nBatas waktu pembayaran adalah 1x24 jam. Jika melewati batas waktu tersebut, data pendaftaran Anda akan otomatis terhapus, dan silahkan daftar kembali.\nUntuk keamanan data transfer, bukti transfer agar dikirim juga ke whatsapp panitia yang tertera\nDengan mengikuti Alpha Chase Run 2026, peserta dianggap telah membaca, memahami, dan menyetujui seluruh peraturan yang berlaku.\nPeserta wajib melakukan pembayaran hanya melalui : BRI ALPHA CHASE RUN 033301023582537\n`,
        tglMulai: '1 Juni 2026',
        tglTutup: '31 Agustus 2026',
        tanggal: '27 September 2026',
        lokasi: 'DHBS Bontang Lestari',
        waPanitia: '6281234567890',
        kategori: '2,5K Kids (Rp 150.000)\n5K Pelajar (Rp 175.000)\n5K Umum (Rp 175.000)\n5K Fun Run (Rp 175.000)',
        jerseySizes: 'XS\nS\nM\nL\nXL\nXXL\nXXXL',
        diskonKuota: 100,
        diskonNominal: 25000,
        gambar: '[]',
        bgHero: '',
        bgHeroOpacity: '10',
        benefits: '[]',
        mapEmbed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31918.522038388972!2d117.42808531562503!3d0.07102560000000266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x320a0c03f1a357d7%3A0xc099a0e0689e519!2sDHBS%20Bontang%20Lestari!5e0!3m2!1sid!2sid!4v1779038544755!5m2!1sid!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
    }
};

let uploadedImages = [];
let uploadedBgHero = '';
let uploadedBenefits = [];
let paymentInterval = null;

// =====================================================================
// NAVIGASI GLOBAL
// =====================================================================
window.nav = function(pageId) {
    if (paymentInterval) { clearInterval(paymentInterval); paymentInterval = null; }
    
    // Keamanan Akses: Lindungi halaman admin jika belum login
    const adminPages = ['dashboard', 'master', 'logistik', 'checkin', 'pengaturan', 'startgate'];
    if (adminPages.includes(pageId) && State.role === 'guest') {
        pageId = 'akun';
    }
    if (State.role === 'panitia' && (pageId === 'dashboard' || pageId === 'master' || pageId === 'pengaturan')) {
        pageId = 'checkin';
    }

    // Hentikan scanner kamera jika berpindah dari halaman startgate
    if (pageId !== 'startgate' && window.stopStartGateScanner) {
        window.stopStartGateScanner();
    }

    State.activePage = pageId;

    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const pageEl = document.getElementById('page-' + pageId);
    if (pageEl) pageEl.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('text-blue-600', 'bg-blue-50'));
    const activeLink = document.querySelector(`.nav-link[onclick="nav('${pageId}')"]`);
    if(activeLink) activeLink.classList.add('text-blue-600', 'bg-blue-50');

    const statusResultEl = document.getElementById('statusResult');
    if (statusResultEl) statusResultEl.classList.add('hidden');
    window.scrollTo(0,0);

    requestAnimationFrame(() => {
        if(pageId === 'publik') { renderPublikTable(); }
        if(pageId === 'daftar') { checkRegistrationStatus(); updateDiskonBanner(); }
        if(pageId === 'dashboard') { updateDashboardCounters(); }
        if(pageId === 'master') { renderMasterTable(); }
        if(pageId === 'logistik') { renderLogistikData(); }
        if(pageId === 'status') { renderPublicParticipants(); }
        if(pageId === 'checkin') { renderCheckinHistory(); }
        if(pageId === 'bibcheck') { resetBibSearch(); }
        if(pageId === 'startgate') { initStartGatePage(); }
        if(pageId === 'startlive') { initStartLivePage(); }
    });
};

// =====================================================================
// OPERASI DATABASE FIREBASE (FIRESTORE)
// =====================================================================
function getDb() {
    return window.FirebaseBridge ? window.FirebaseBridge.getDb() : null;
}

// Inisialisasi Listener Real-Time Firestore
function setupFirestoreListeners() {
    const db = getDb();
    if (!db) {
        console.warn("Firestore belum siap. Menggunakan mode penyimpanan lokal.");
        loadLocalFallbackData();
        return;
    }

    // 1. Listener Real-Time Pengaturan Event
    if (State.unsubscribeSettings) State.unsubscribeSettings();
    State.unsubscribeSettings = db.collection('settings').doc('event_config').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            State.settings = Object.assign({}, State.settings, data);
            applySettingsToUI();
        } else {
            // Pertama kali dibuat: upload default settings
            db.collection('settings').doc('event_config').set(State.settings).catch(console.error);
            applySettingsToUI();
        }
    }, (error) => {
        console.error("Error pada snapshot settings:", error);
    });

    // 2. Listener Real-Time Data Peserta
    if (State.unsubscribePeserta) State.unsubscribePeserta();
    State.unsubscribePeserta = db.collection('peserta').onSnapshot((snapshot) => {
        const now = Date.now();
        const validList = [];
        
        snapshot.forEach((doc) => {
            const p = doc.data();
            // Cek kedaluwarsa 24 jam untuk yang belum bayar
            if (p.status === 'Menunggu Pembayaran' && (now - (parseInt(p.createdAt) || 0)) >= 24 * 60 * 60 * 1000) {
                // Hapus otomatis dokumen yang telah kedaluwarsa dari Firestore
                db.collection('peserta').doc(p.kode).delete().catch(console.error);
            } else {
                validList.push(p);
            }
        });

        if (validList.length > 0) {
            State.currentMasterList = validList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else if (State.currentMasterList.length === 0) {
            loadSeedDataIfEmpty();
        }
        
        // Perbarui tampilan halaman aktif secara otomatis
        refreshActivePageUI();
    }, (error) => {
        console.warn("Firestore belum aktif atau error, menggunakan data seed lokal:", error);
        loadSeedDataIfEmpty();
        refreshActivePageUI();
    });
}

function refreshActivePageUI() {
    if (State.activePage === 'publik') renderPublikTable();
    if (State.activePage === 'daftar') { checkRegistrationStatus(); updateDiskonBanner(); }
    if (State.activePage === 'dashboard') updateDashboardCounters();
    if (State.activePage === 'master') renderMasterTable();
    if (State.activePage === 'logistik') renderLogistikData();
    if (State.activePage === 'status') renderPublicParticipants();
    if (State.activePage === 'checkin') renderCheckinHistory();
    if (State.activePage === 'startlive') { renderStartLiveFeed(); updateStartLiveCounters(); }
    if (State.activePage === 'startgate') updateStartGateCounters();
}

// Fallback jika Firebase belum diatur (LocalStorage)
function loadLocalFallbackData() {
    try {
        const storedSettings = localStorage.getItem('acr_local_settings');
        if (storedSettings) State.settings = Object.assign({}, State.settings, JSON.parse(storedSettings));
        
        const storedPeserta = localStorage.getItem('acr_local_peserta');
        if (storedPeserta) State.currentMasterList = JSON.parse(storedPeserta);
    } catch(e) {
        console.warn("Gagal membaca data lokal fallback:", e);
    }
    applySettingsToUI();
    refreshActivePageUI();
}

function saveLocalFallbackData() {
    try {
        localStorage.setItem('acr_local_settings', JSON.stringify(State.settings));
        localStorage.setItem('acr_local_peserta', JSON.stringify(State.currentMasterList));
    } catch(e) {
        console.warn("Gagal menyimpan data lokal fallback:", e);
    }
}

// Tambah Peserta ke Firestore
async function addPeserta(payload) {
    const db = getDb();
    if (db) {
        await db.collection('peserta').doc(payload.kode).set(payload);
    } else {
        // Fallback lokal jika belum connect Firebase
        State.currentMasterList.unshift(payload);
        saveLocalFallbackData();
        refreshActivePageUI();
    }
}

// Update Peserta di Firestore
async function updatePeserta(kode, updateFields) {
    const db = getDb();
    if (db) {
        await db.collection('peserta').doc(kode).set(updateFields, { merge: true });
    } else {
        const idx = State.currentMasterList.findIndex(p => p.kode === kode);
        if (idx !== -1) {
            State.currentMasterList[idx] = Object.assign({}, State.currentMasterList[idx], updateFields);
            saveLocalFallbackData();
            refreshActivePageUI();
        }
    }
}

// Hapus Peserta di Firestore
async function deletePesertaRecord(kode) {
    const db = getDb();
    if (db) {
        await db.collection('peserta').doc(kode).delete();
    } else {
        State.currentMasterList = State.currentMasterList.filter(p => p.kode !== kode);
        saveLocalFallbackData();
        refreshActivePageUI();
    }
}

// Simpan Pengaturan ke Firestore
async function saveSettings(settingsPayload) {
    const db = getDb();
    if (db) {
        await db.collection('settings').doc('event_config').set(settingsPayload, { merge: true });
    } else {
        State.settings = Object.assign({}, State.settings, settingsPayload);
        saveLocalFallbackData();
        applySettingsToUI();
    }
}

// =====================================================================
// CUSTOM ALERTS & CONFIRMS
// =====================================================================
let activeModalResolver = null;

window.closeCustomModal = function(val = true) {
    const modal = document.getElementById('customModal');
    if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
    }
    if (activeModalResolver) {
        const resolve = activeModalResolver;
        activeModalResolver = null;
        resolve(val);
    }
};

// Global ESC key listener to close modal
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('customModal');
        if (modal && !modal.classList.contains('hidden')) {
            window.closeCustomModal(false);
        }
    }
});

window.customAlert = function(message, type = 'info', title = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const iconDiv = document.getElementById('customModalIcon');
        const titleEl = document.getElementById('customModalTitle');
        const descEl = document.getElementById('customModalDesc');
        const actionsDiv = document.getElementById('customModalActions');
        const closeBtn = document.getElementById('customModalCloseBtn');

        activeModalResolver = resolve;

        descEl.innerHTML = message;
        if (type === 'error') {
            iconDiv.className = "w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3";
            iconDiv.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
            titleEl.textContent = title || "Terjadi Kesalahan";
        } else if (type === 'success') {
            iconDiv.className = "w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3";
            iconDiv.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            titleEl.textContent = title || "Berhasil";
        } else if (type === 'warning') {
            iconDiv.className = "w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3";
            iconDiv.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
            titleEl.textContent = title || "Peringatan";
        } else {
            iconDiv.className = "w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3";
            iconDiv.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            titleEl.textContent = title || "Informasi";
        }

        actionsDiv.innerHTML = `<button id="customModalOkBtn" class="flex-1 px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl transition text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"><span>Tutup & Keluar</span> ✕</button>`;
        modal.classList.remove('hidden');

        document.getElementById('customModalOkBtn').onclick = () => window.closeCustomModal(true);
        if (closeBtn) {
            closeBtn.onclick = () => window.closeCustomModal(true);
        }
        modal.onclick = (e) => {
            if (e.target === modal) window.closeCustomModal(true);
        };
    });
};

window.customConfirm = function(message, title = "Konfirmasi") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const iconDiv = document.getElementById('customModalIcon');
        const titleEl = document.getElementById('customModalTitle');
        const descEl = document.getElementById('customModalDesc');
        const actionsDiv = document.getElementById('customModalActions');
        const closeBtn = document.getElementById('customModalCloseBtn');

        activeModalResolver = resolve;

        descEl.innerHTML = message;
        titleEl.textContent = title;
        iconDiv.className = "w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3";
        iconDiv.innerHTML = `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

        actionsDiv.innerHTML = `
            <button id="customModalCancelBtn" class="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm border border-slate-200 active:scale-95 cursor-pointer">Batal / Keluar</button>
            <button id="customModalConfirmBtn" class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm shadow-md active:scale-95 cursor-pointer">Ya, Lanjutkan</button>
        `;
        modal.classList.remove('hidden');

        document.getElementById('customModalConfirmBtn').onclick = () => window.closeCustomModal(true);
        document.getElementById('customModalCancelBtn').onclick = () => window.closeCustomModal(false);
        if (closeBtn) {
            closeBtn.onclick = () => window.closeCustomModal(false);
        }
        modal.onclick = (e) => {
            if (e.target === modal) window.closeCustomModal(false);
        };
    });
};

// =====================================================================
// UI HELPERS & FORMATTER
// =====================================================================
window.showLoading = function(show, text = 'Memproses...') { 
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none'; 
        if(show) document.getElementById('loadingText').textContent = text;
    }
};

function formatDisplayDate(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const d = new Date(val);
        if (!isNaN(d)) {
            const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }
    }
    return val;
}

function startOnlineCounter() {
    const counterEl = document.getElementById('onlineCounter');
    if (!counterEl) return;
    let onlineUsers = Math.floor(Math.random() * 10) + 5; 
    counterEl.textContent = onlineUsers;
    setInterval(() => {
        const change = Math.floor(Math.random() * 6) - 2; 
        onlineUsers += change;
        if (onlineUsers < 2) onlineUsers = Math.floor(Math.random() * 3) + 2; 
        if (onlineUsers > 50) onlineUsers -= 5;
        counterEl.textContent = onlineUsers;
    }, 5000 + Math.random() * 3000);
}

// =====================================================================
// OTENTIKASI ADMIN & PANITIA
// =====================================================================
window.loginAdmin = function() {
    const passInput = document.getElementById('adminPassword');
    const val = passInput.value;
    
    if(val === 'super@dmin1') {
        State.role = 'superadmin';
        sessionStorage.setItem('acr_role', 'superadmin');
        const adminMenus = document.getElementById('adminMenus');
        if (adminMenus) {
            adminMenus.classList.remove('hidden');
            adminMenus.classList.add('flex');
        }
        document.querySelectorAll('[data-req="superadmin"]').forEach(el => el.classList.remove('hidden'));
        
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('logoutForm').classList.remove('hidden');
        document.getElementById('akunTitle').textContent = "Super Admin Aktif";
        document.getElementById('akunDesc').textContent = "Akses Penuh: Verifikasi, Master Data, & Pengaturan.";
        passInput.value = '';
        
        window.nav('dashboard');
    } else if(val === 'p@niti4') {
        State.role = 'panitia';
        sessionStorage.setItem('acr_role', 'panitia');
        const adminMenus = document.getElementById('adminMenus');
        if (adminMenus) {
            adminMenus.classList.remove('hidden');
            adminMenus.classList.add('flex');
        }
        document.querySelectorAll('[data-req="superadmin"]').forEach(el => el.classList.add('hidden'));
        
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('logoutForm').classList.remove('hidden');
        document.getElementById('akunTitle').textContent = "Panitia Aktif";
        document.getElementById('akunDesc').textContent = "Akses Terbatas: Hanya Check-In & Logistik.";
        passInput.value = '';
        
        window.nav('checkin');
    } else {
        window.customAlert("Password Salah! Akses ditolak.", "error", "Gagal Login");
    }
};

window.logoutAdmin = function() {
    State.role = 'guest';
    sessionStorage.removeItem('acr_role');
    const adminMenus = document.getElementById('adminMenus');
    if (adminMenus) {
        adminMenus.classList.add('hidden');
        adminMenus.classList.remove('flex');
    }
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('logoutForm').classList.add('hidden');
    document.getElementById('akunTitle').textContent = "Welcome ACR 2026";
    document.getElementById('akunDesc').textContent = "Silahkan Anda Login";
    window.nav('info');
};

// =====================================================================
// PENGATURAN TAMPILAN EVENT (UI)
// =====================================================================
function applySettingsToUI() {
    const s = State.settings;
    document.getElementById('infoTitle').textContent = s.judul || 'Alpha Chase Run';
    document.getElementById('infoDesc').textContent = s.deskripsi || '';
    document.getElementById('infoDate').textContent = formatDisplayDate(s.tanggal) || '';
    document.getElementById('infoLocation').textContent = s.lokasi || '';
    document.getElementById('infoTglMulai').textContent = formatDisplayDate(s.tglMulai) || 'TBA';
    document.getElementById('infoTglTutup').textContent = formatDisplayDate(s.tglTutup) || 'TBA';
    document.getElementById('btnWaPanitia').href = `https://wa.me/${s.waPanitia || '6281234567890'}`;

    uploadedBgHero = s.bgHero && s.bgHero.trim() !== '' ? s.bgHero : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath fill='%23ffffff' d='M272 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM113.7 264.4c-8.7-10.9-24.8-12.7-35.7-4s-12.7 24.8-4 35.7L136 374.3V480c0 17.7 14.3 32 32 32s32-14.3 32-32V384c0-26.4-16.2-50.1-40.8-59.8L113.7 264.4zM245.8 174.9c-15.5-13.4-38.3-15.5-55.9-5.1L126.5 207c-15.2 8.9-20.3 28.5-11.4 43.7s28.5 20.3 43.7 11.4l50.2-29.4 33 46.1c11.3 15.8 32.1 20.7 49 11.6l81.6-43.5c15.5-8.3 21.4-27.5 13.1-43.1s-27.5-21.4-43.1-13.1L277 220 245.8 174.9z'/%3E%3C/svg%3E";
    const heroOverlay = document.getElementById('heroBgOverlay');
    if (uploadedBgHero) { 
        heroOverlay.style.backgroundImage = `url('${uploadedBgHero}')`; 
        heroOverlay.style.display = 'block'; 
        heroOverlay.style.opacity = (s.bgHeroOpacity || '35') / 100;
    } else { 
        heroOverlay.style.display = 'none'; 
    }
    renderBgHeroPreview();

    const mapContainer = document.getElementById('infoMap');
    if (s.mapEmbed && s.mapEmbed.trim() !== '') {
        document.getElementById('infoMapWrapper').classList.remove('hidden');
        mapContainer.innerHTML = s.mapEmbed;
        const iframe = mapContainer.querySelector('iframe');
        if (iframe) { iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = 'none'; }
    } else {
        document.getElementById('infoMapWrapper').classList.add('hidden');
        mapContainer.innerHTML = '';
    }

    try { uploadedImages = JSON.parse(s.gambar || "[]"); if(!Array.isArray(uploadedImages)) uploadedImages = []; } catch(e){ uploadedImages = []; }
    try { uploadedBenefits = JSON.parse(s.benefits || "[]"); if(!Array.isArray(uploadedBenefits)) uploadedBenefits = []; } catch(e){ uploadedBenefits = []; }

    const benefitContainer = document.getElementById('infoBenefits');
    benefitContainer.innerHTML = '';
    if(uploadedBenefits.length > 0) {
        document.getElementById('infoBenefitsWrapper').classList.remove('hidden');
        uploadedBenefits.forEach(img => { 
            benefitContainer.innerHTML += `<div class="min-w-[220px] w-[220px] sm:min-w-[280px] sm:w-[280px] flex-shrink-0 bg-white rounded-2xl overflow-hidden shadow border border-slate-100 snap-center"><img src="${img}" class="w-full h-40 sm:h-48 object-cover block"></div>`; 
        });
    } else { 
        document.getElementById('infoBenefitsWrapper').classList.add('hidden'); 
    }

    const gallery = document.getElementById('infoGallery');
    gallery.innerHTML = '';
    if(uploadedImages.length > 0) {
        gallery.classList.remove('hidden');
        uploadedImages.forEach(img => { 
            gallery.innerHTML += `<div class="w-full bg-slate-200 sm:rounded-2xl overflow-hidden shadow-sm"><img src="${img}" class="w-full h-auto object-cover block"></div>`; 
        });
    } else { 
        gallery.classList.add('hidden'); 
    }

    document.getElementById('setJudul').value = s.judul || '';
    document.getElementById('setDeskripsi').value = s.deskripsi || '';
    document.getElementById('setTglMulai').value = formatDisplayDate(s.tglMulai) || '';
    document.getElementById('setTglTutup').value = formatDisplayDate(s.tglTutup) || '';
    document.getElementById('setTanggal').value = formatDisplayDate(s.tanggal) || '';
    document.getElementById('setLokasi').value = s.lokasi || '';
    document.getElementById('setWaPanitia').value = s.waPanitia || '';
    document.getElementById('setKategori').value = s.kategori || '';
    document.getElementById('setJerseySizes').value = s.jerseySizes || '';
    if (document.getElementById('setDiskonKuota')) document.getElementById('setDiskonKuota').value = s.diskonKuota || '';
    if (document.getElementById('setDiskonNominal')) document.getElementById('setDiskonNominal').value = s.diskonNominal || '';
    document.getElementById('setMapEmbed').value = s.mapEmbed || '';
    document.getElementById('setBgOpacity').value = s.bgHeroOpacity || '35';
    document.getElementById('setAturan').value = s.aturan || '';
    
    const aturanList = document.getElementById('infoAturanList');
    const aturanWrapper = document.getElementById('infoAturanWrapper');
    aturanList.innerHTML = '';
    if (s.aturan && s.aturan.trim() !== '') {
        aturanWrapper.classList.remove('hidden');
        const aturanItems = s.aturan.split('\n').filter(item => item.trim() !== '');
        aturanItems.forEach(item => {
            aturanList.innerHTML += `
                <li class="flex items-start">
                    <div class="mt-0.5 mr-3 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span class="text-sm sm:text-base text-slate-700 leading-relaxed">${item.trim()}</span>
                </li>`;
        });
    } else {
        aturanWrapper.classList.add('hidden');
    }
    
    const catSelect = document.getElementById('regKategori');
    catSelect.innerHTML = '<option value="" disabled selected>Pilih Kategori...</option>';
    if(s.kategori) s.kategori.split('\n').filter(c => c.trim() !== '').forEach(c => catSelect.innerHTML += `<option value="${c.trim()}">${c.trim()}</option>`);

    const optPendek = document.getElementById('optPendek');
    const optPanjang = document.getElementById('optPanjang');
    optPendek.innerHTML = ''; optPanjang.innerHTML = '';
    if(s.jerseySizes) {
        s.jerseySizes.split('\n').filter(c => c.trim() !== '').forEach(c => {
            optPendek.innerHTML += `<option value="${c.trim()} (Pendek)">${c.trim()} (Pendek)</option>`;
            optPanjang.innerHTML += `<option value="${c.trim()} (Panjang)">${c.trim()} (Panjang)</option>`;
        });
    }
    
    window.renderAdminImagePreviews();
    window.renderBenefitPreviews();
}

// =====================================================================
// UPLOAD & KOMPRESI GAMBAR
// =====================================================================
function compressImage(file, isHero = false) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = isHero ? 600 : 700;  
                const MAX_HEIGHT = isHero ? 600 : 700;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                let quality = 0.85;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                while (dataUrl.length > 50000 && quality > 0.3) {
                    quality -= 0.15;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                if (dataUrl.length > 50000) {
                    const w = width * 0.6;
                    const h = height * 0.6;
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                }
                
                resolve(dataUrl); 
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderBgHeroPreview() {
    const container = document.getElementById('bgHeroPreviewContainer');
    if (uploadedBgHero) {
        container.innerHTML = `<div class="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-blue-600"><img src="${uploadedBgHero}" class="w-full h-full object-contain opacity-50"><button type="button" onclick="removeBgHero()" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600">&times;</button></div>`;
    } else { 
        container.innerHTML = ''; 
    }
}
window.removeBgHero = function() { uploadedBgHero = ''; renderBgHeroPreview(); };

const bgHeroInputElem = document.getElementById('setBgHeroInput');
if (bgHeroInputElem) {
    bgHeroInputElem.addEventListener('change', async function(e) {
        if(e.target.files.length > 0) {
            window.showLoading(true, "Memproses Gambar...");
            uploadedBgHero = await compressImage(e.target.files[0], true);
            renderBgHeroPreview(); 
            window.showLoading(false); 
            this.value = '';
        }
    });
}

const gambarInputElem = document.getElementById('setGambarInput');
if (gambarInputElem) {
    gambarInputElem.addEventListener('change', async function(e) {
        if(e.target.files.length > 0) {
            window.showLoading(true, "Memproses Gambar...");
            for (let file of e.target.files) uploadedImages.push(await compressImage(file));
            window.renderAdminImagePreviews();
            window.showLoading(false);
            this.value = '';
        }
    });
}
window.removeUploadedImage = function(i) { uploadedImages.splice(i, 1); window.renderAdminImagePreviews(); };
window.renderAdminImagePreviews = function() {
    const container = document.getElementById('imagePreviewContainer');
    if(!container) return;
    container.innerHTML = '';
    uploadedImages.forEach((imgSrc, i) => {
        container.innerHTML += `<div class="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm"><img src="${imgSrc}" class="w-full h-full object-cover"><button type="button" onclick="removeUploadedImage(${i})" class="absolute top-1 right-1 bg-red-500 bg-opacity-90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600 transition">&times;</button></div>`;
    });
};

const benefitInputElem = document.getElementById('setBenefitInput');
if (benefitInputElem) {
    benefitInputElem.addEventListener('change', async function(e) {
        if(e.target.files.length > 0) {
            window.showLoading(true, "Memproses Gambar...");
            for (let file of e.target.files) uploadedBenefits.push(await compressImage(file));
            window.renderBenefitPreviews();
            window.showLoading(false);
            this.value = '';
        }
    });
}
window.removeBenefitImage = function(i) { uploadedBenefits.splice(i, 1); window.renderBenefitPreviews(); };
window.renderBenefitPreviews = function() {
    const container = document.getElementById('benefitPreviewContainer');
    if(!container) return;
    container.innerHTML = '';
    uploadedBenefits.forEach((imgSrc, i) => {
        container.innerHTML += `<div class="relative w-24 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm"><img src="${imgSrc}" class="w-full h-full object-cover"><button type="button" onclick="removeBenefitImage(${i})" class="absolute top-1 right-1 bg-red-500 bg-opacity-90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600 transition">&times;</button></div>`;
    });
};

document.getElementById('formPengaturan').addEventListener('submit', async function(e) {
    e.preventDefault();
    window.showLoading(true, "Menyimpan Pengaturan...");
    const payload = {
        judul: document.getElementById('setJudul').value,
        deskripsi: document.getElementById('setDeskripsi').value,
        tglMulai: document.getElementById('setTglMulai').value,
        tglTutup: document.getElementById('setTglTutup').value,
        tanggal: document.getElementById('setTanggal').value,
        lokasi: document.getElementById('setLokasi').value,
        waPanitia: document.getElementById('setWaPanitia').value,
        kategori: document.getElementById('setKategori').value,
        jerseySizes: document.getElementById('setJerseySizes').value,
        diskonKuota: document.getElementById('setDiskonKuota') ? document.getElementById('setDiskonKuota').value : '',
        diskonNominal: document.getElementById('setDiskonNominal') ? document.getElementById('setDiskonNominal').value : '',
        aturan: document.getElementById('setAturan').value,
        gambar: JSON.stringify(uploadedImages),
        bgHero: uploadedBgHero,
        bgHeroOpacity: document.getElementById('setBgOpacity').value,
        benefits: JSON.stringify(uploadedBenefits),
        mapEmbed: document.getElementById('setMapEmbed').value
    };
    
    State.settings = Object.assign({}, State.settings, payload);
    applySettingsToUI();

    try {
        await saveSettings(payload);
        await window.customAlert("Pengaturan Berhasil Disimpan secara permanen ke Firebase!", "success");
    } catch(e) { 
        await window.customAlert("Gagal menyimpan ke Firebase:\n\n" + e.message, "error"); 
    }
    window.showLoading(false);
});

// =====================================================================
// LOGIKA PENDAFTARAN & TANGGAL
// =====================================================================
function parseIndoDate(dateStr) {
    if (!dateStr) return new Date(0);
    let str = dateStr.toString().toLowerCase().trim();
    if (str.includes('t') && str.includes('z')) {
        return new Date(dateStr);
    }
    const months = {'januari':'01', 'februari':'02', 'maret':'03', 'april':'04', 'mei':'05', 'juni':'06', 'juli':'07', 'agustus':'08', 'september':'09', 'oktober':'10', 'november':'11', 'desember':'12', 'jan':'01', 'feb':'02', 'mar':'03', 'apr':'04', 'mei':'05', 'jun':'06', 'jul':'07', 'agu':'08', 'sep':'09', 'okt':'10', 'nov':'11', 'des':'12'};
    for (let m in months) { if (str.includes(m)) { str = str.replace(m, months[m]); break; } }
    const parts = str.split(/[\s\-\/]+/);
    if(parts.length >= 3) {
        let y = parts[2].length === 4 ? parts[2] : (parts[0].length === 4 ? parts[0] : new Date().getFullYear());
        let m = parts[1].padStart(2, '0');
        let d = parts[0].length <= 2 ? parts[0].padStart(2, '0') : parts[2].padStart(2, '0');
        let parsed = new Date(`${y}-${m}-${d}T00:00:00`);
        if(!isNaN(parsed)) return parsed;
    }
    return new Date(dateStr);
}

function checkRegistrationStatus() {
    const startStr = State.settings.tglMulai;
    const endStr = State.settings.tglTutup;

    const formDaftar = document.getElementById('formDaftar');
    const msgTutup = document.getElementById('regClosedMsg');
    if(!formDaftar || !msgTutup) return;

    const start = parseIndoDate(startStr);
    const end = parseIndoDate(endStr);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    
    if (isNaN(start) || isNaN(end)) {
        formDaftar.classList.remove('hidden');
        msgTutup.classList.add('hidden');
    } else if (now >= start && now <= end) {
        formDaftar.classList.remove('hidden');
        msgTutup.classList.add('hidden');
    } else {
        formDaftar.classList.add('hidden');
        msgTutup.classList.remove('hidden');
        if (now < start) {
            document.getElementById('regClosedTitle').textContent = "Pendaftaran Belum Dibuka";
            document.getElementById('regClosedDesc').textContent = `Mohon bersabar, pendaftaran baru akan dibuka mulai tanggal ${formatDisplayDate(startStr)}.`;
        } else if (now > end) {
            document.getElementById('regClosedTitle').textContent = "Pendaftaran Telah Ditutup";
            document.getElementById('regClosedDesc').textContent = `Mohon maaf, batas waktu pendaftaran telah berakhir pada tanggal ${formatDisplayDate(endStr)}.`;
        }
    }
    updateDiskonBanner();
}

function updateDiskonBanner() {
    const kuota = parseInt(State.settings.diskonKuota) || 0;
    const sisa = kuota - State.currentMasterList.length;
    const banner = document.getElementById('bannerDiskon');
    if (!banner) return;
    
    if (kuota > 0) {
        banner.classList.remove('hidden');
        if (sisa > 0) {
            banner.className = "mb-4 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between";
            const nominal = parseInt(State.settings.diskonNominal) || 0;
            document.getElementById('bannerDiskonText').innerHTML = `Potongan harga <strong>Rp ${nominal.toLocaleString('id-ID')}</strong> untuk pendaftar awal.`;
            document.getElementById('sisaKuota').textContent = sisa;
            document.getElementById('sisaKuota').className = "text-lg font-black text-emerald-600";
        } else {
            banner.className = "mb-4 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between";
            document.getElementById('bannerDiskonText').innerHTML = `Mohon maaf, kuota diskon pendaftar awal telah habis. Tarif normal berlaku.`;
            document.getElementById('sisaKuota').textContent = "0";
            document.getElementById('sisaKuota').className = "text-lg font-black text-slate-500";
        }
    } else {
        banner.classList.add('hidden');
    }
}

// =====================================================================
// AKSI PESERTA (DAFTAR, BAYAR, CEK STATUS)
// =====================================================================
document.getElementById('formDaftar').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const inputKtp = document.getElementById('regKtp').value.trim();
    if (inputKtp.length !== 16) {
        await window.customAlert(`Nomor KTP/NIK harus persis berjumlah 16 digit angka.<br><br>Saat ini Anda memasukkan ${inputKtp.length} digit.`, "warning", "NIK Tidak Valid!");
        return;
    }

    const exists = State.currentMasterList.find(p => p.ktp === inputKtp);
    if (exists) {
        await window.customAlert(`Nomor KTP/NIK <strong>${inputKtp}</strong> sudah digunakan oleh peserta bernama <strong>${exists.nama}</strong>.`, "error", "NIK Sudah Terdaftar!");
        return;
    }

    window.showLoading(true, "Mendaftarkan ke Firebase...");
    const kode = 'RUN-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const kategoriText = document.getElementById('regKategori').value;
    const jerseyText = document.getElementById('regJersey').value;
    
    const words = kategoriText.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
    const targetWord = words.find(w => /^[A-Za-z]+$/.test(w) && w.toUpperCase() !== 'K' && w.toUpperCase() !== 'KM') || words.find(w => /^[A-Za-z]+$/.test(w)) || "X";
    const catPrefix = targetWord.charAt(0).toUpperCase();
    
    // Format nomor BIB mulai dari angka 1000 (misal urut 1 = P-1001, urut 2 = P-1002, dst)
    let nextBibSeq = 1000 + State.currentMasterList.length + 1;
    State.currentMasterList.forEach(p => {
        if (p.bibNumber) {
            const m = String(p.bibNumber).match(/\d+$/);
            if (m) {
                const num = parseInt(m[0], 10);
                if (num >= nextBibSeq) {
                    nextBibSeq = num + 1;
                }
            }
        }
    });
    const newBib = catPrefix + "-" + nextBibSeq;
    
    let hargaDasar = 0;
    const match = kategoriText.match(/\(Rp\s*([\d.]+)\)/i);
    if (match) { hargaDasar = parseInt(match[1].replace(/\./g, '')); }
    let tambahanLengan = 0;
    if (jerseyText.toLowerCase().includes('panjang')) { tambahanLengan = 5000; }
    
    let diskon = 0;
    if (State.currentMasterList.length < (parseInt(State.settings.diskonKuota) || 0)) {
        diskon = parseInt(State.settings.diskonNominal) || 0;
    }
    const totalTagihan = Math.max(0, hargaDasar + tambahanLengan - diskon);

    const payload = {
        kode: kode,
        nama: document.getElementById('regNama').value,
        ktp: inputKtp,
        gender: document.getElementById('regGender').value,
        kategori: kategoriText,
        bibName: document.getElementById('regBibName').value,
        wa: document.getElementById('regWa').value,
        jersey: jerseyText,
        komunitas: document.getElementById('regKomunitas').value,
        alamat: document.getElementById('regAlamat').value,
        provinsi: document.getElementById('regProvinsi').value,
        kota: document.getElementById('regKota').value,
        darurat: document.getElementById('regDarurat').value,
        komorbid: document.getElementById('regKomorbid').value,
        tagihan: totalTagihan,
        diskon: diskon,
        status: 'Menunggu Pembayaran',
        bibNumber: newBib,
        checkedIn: false,
        kodeLogistik: '',
        logistikDiambil: '',
        bukti: '',
        createdAt: Date.now()
    };

    try {
        await addPeserta(payload);
        window.showLoading(false);
        await window.customAlert(`<strong>PENDAFTARAN BERHASIL!</strong><br><br>Kode Daftar Anda: <strong class="text-blue-600 text-lg">${kode}</strong><br><br>Silakan Screenshot/Catat kode ini untuk melakukan konfirmasi pembayaran.`, "success");
        this.reset();
        document.getElementById('payKode').value = kode;
        window.nav('bayar');
        window.cekTagihan();
    } catch(e) { 
        window.showLoading(false);
        await window.customAlert("Gagal mendaftar:\n\n" + e.message, "error"); 
    }
});

window.cekTagihan = async function() {
    const kode = document.getElementById('payKode').value.toUpperCase().trim();
    if(!kode) { 
        await window.customAlert('Masukkan Kode Daftar terlebih dahulu.', 'warning'); 
        return; 
    }
    
    let p = State.currentMasterList.find(x => x.kode === kode);

    if (p) {
        if (p.status === 'Menunggu Pembayaran') {
            const now = Date.now();
            const diff = (parseInt(p.createdAt) || now) + (24 * 60 * 60 * 1000) - now;
            if (diff <= 0) {
                deletePesertaRecord(p.kode);
                await window.customAlert("Waktu pembayaran telah habis (1x24 Jam). Data pendaftaran Anda otomatis dibatalkan oleh sistem. Silakan mendaftar ulang.", "error", "Waktu Habis!");
                document.getElementById('boxTagihan').classList.add('hidden');
                return;
            }
        }

        document.getElementById('tagNama').textContent = p.nama;
        document.getElementById('tagKategori').textContent = p.kategori;
        document.getElementById('tagJersey').textContent = p.jersey;
        
        let hargaDasar = 0;
        const match = p.kategori.match(/\(Rp\s*([\d.]+)\)/i);
        if (match) hargaDasar = parseInt(match[1].replace(/\./g, ''));
        document.getElementById('tagHargaDasar').textContent = "Rp " + hargaDasar.toLocaleString('id-ID');

        let tambahan = 0;
        if (p.jersey.toLowerCase().includes('panjang')) tambahan = 5000;
        document.getElementById('tagHargaLengan').textContent = "+ Rp " + tambahan.toLocaleString('id-ID');

        let diskon = p.diskon || 0;
        const rowDiskon = document.getElementById('rowDiskonTagihan');
        if (diskon > 0) {
            if (rowDiskon) {
                rowDiskon.classList.remove('hidden');
                document.getElementById('tagDiskon').textContent = "- Rp " + diskon.toLocaleString('id-ID');
            }
        } else {
            if (rowDiskon) rowDiskon.classList.add('hidden');
        }

        document.getElementById('tagTotal').textContent = "Rp " + (p.tagihan || 0).toLocaleString('id-ID');
        document.getElementById('boxTagihan').classList.remove('hidden');
        
        if (p.status === 'Menunggu Pembayaran') {
            startPaymentTimer(p);
        } else {
            document.getElementById('paymentTimerContainer').classList.add('hidden');
        }
    } else {
        await window.customAlert("Kode Daftar tidak ditemukan di sistem!", "error");
        document.getElementById('boxTagihan').classList.add('hidden');
    }
};

function startPaymentTimer(p) {
    if (paymentInterval) { clearInterval(paymentInterval); paymentInterval = null; }
    
    const timerContainer = document.getElementById('paymentTimerContainer');
    const timerDisplay = document.getElementById('paymentTimer');
    const timerLabel = timerContainer.querySelector('p');
    
    const createdAt = parseInt(p.createdAt) || Date.now();
    const expireTime = createdAt + (24 * 60 * 60 * 1000);
    
    timerDisplay.classList.remove('text-slate-500');
    timerDisplay.classList.add('text-red-600');
    timerContainer.classList.remove('bg-slate-100', 'border-slate-300');
    timerContainer.classList.add('bg-red-50', 'border-red-200');
    timerLabel.textContent = "Sisa Waktu Pembayaran (1x24 Jam):";
    timerLabel.classList.remove('text-slate-500');
    timerLabel.classList.add('text-red-600');
    
    timerContainer.classList.remove('hidden');

    function update() {
        const now = Date.now();
        const diff = expireTime - now;

        if (diff <= 0) {
            clearInterval(paymentInterval);
            deletePesertaRecord(p.kode);

            timerDisplay.textContent = "00:00:00";
            timerDisplay.classList.replace('text-red-600', 'text-slate-500');
            timerContainer.classList.replace('bg-red-50', 'bg-slate-100');
            timerContainer.classList.replace('border-red-200', 'border-slate-300');
            timerLabel.textContent = "Waktu Pembayaran Telah Habis";
            timerLabel.classList.replace('text-red-600', 'text-slate-500');
            
            document.getElementById('boxTagihan').classList.add('hidden');
            document.getElementById('paymentTimerContainer').classList.add('hidden');
            document.getElementById('payKode').value = '';

            window.customAlert("Waktu pembayaran telah habis (1x24 Jam). Data pendaftaran Anda telah dibatalkan otomatis oleh sistem. Silakan mendaftar ulang.", "error", "Waktu Habis!");
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.textContent = 
            String(h).padStart(2, '0') + ":" + 
            String(m).padStart(2, '0') + ":" + 
            String(s).padStart(2, '0');
    }
    
    update();
    paymentInterval = setInterval(update, 1000);
}

document.getElementById('formBayar').addEventListener('submit', async function(e) {
    e.preventDefault();
    const kode = document.getElementById('payKode').value.toUpperCase().trim();
    const fileInput = document.getElementById('payBukti');
    let base64Bukti = "";
    
    if (fileInput.files.length > 0) {
        window.showLoading(true, "Mengompresi Bukti...");
        try { 
            base64Bukti = await compressImage(fileInput.files[0]); 
        } catch(err) { 
            window.showLoading(false); 
            await window.customAlert("Gagal memproses gambar bukti transfer.", "error"); 
            return; 
        }
    } else { 
        await window.customAlert("Harap unggah bukti transfer Anda.", "warning"); 
        return; 
    }

    window.showLoading(true, "Mengirim Bukti ke Firebase...");
    try {
        let p = State.currentMasterList.find(x => x.kode === kode);
        if (p) {
            await updatePeserta(kode, { 
                status: 'Menunggu Verifikasi', 
                bukti: base64Bukti 
            });

            window.showLoading(false);
            await window.customAlert("Bukti pembayaran berhasil terkirim!<br><br>Panitia akan memverifikasi pembayaran Anda.", "success");
            this.reset();
            document.getElementById('checkKode').value = kode;
            document.getElementById('boxTagihan').classList.add('hidden');
            window.nav('status');
            document.getElementById('formStatus').dispatchEvent(new Event('submit'));
        } else { 
            window.showLoading(false);
            await window.customAlert("Kode Daftar tidak ditemukan di sistem!", "error"); 
        }
    } catch(e) { 
        window.showLoading(false);
        await window.customAlert("Error: " + e.message, "error"); 
    }
});

document.getElementById('formStatus').addEventListener('submit', async function(e) {
    e.preventDefault();
    const kode = document.getElementById('checkKode').value.toUpperCase().trim();
    const resBox = document.getElementById('statusResult');
    const bibBox = document.getElementById('bibContainer');
    resBox.classList.add('hidden');

    let p = State.currentMasterList.find(x => x.kode === kode);

    if(p) {
        if (p.status === 'Menunggu Pembayaran') {
            const now = Date.now();
            const diff = (parseInt(p.createdAt) || now) + (24 * 60 * 60 * 1000) - now;
            if (diff <= 0) {
                deletePesertaRecord(p.kode);
                await window.customAlert("Waktu pembayaran telah habis (1x24 Jam). Data pendaftaran Anda otomatis dibatalkan oleh sistem.", "error", "Waktu Habis!");
                return;
            }
        }

        document.getElementById('resNama').textContent = p.nama;
        document.getElementById('resKategori').textContent = p.kategori;
        document.getElementById('resJersey').textContent = p.jersey;
        
        const badge = document.getElementById('resStatusBadge');
        badge.textContent = p.status;
        badge.className = "px-2 py-1 text-[10px] font-bold rounded-md text-center flex-shrink-0 w-24 ";
        if(p.status === 'Menunggu Pembayaran') badge.className += "bg-red-100 text-red-700";
        else if(p.status === 'Menunggu Verifikasi') badge.className += "bg-yellow-100 text-yellow-700";
        else badge.className += "bg-emerald-100 text-emerald-700";
        
        if(p.status === 'Verified') {
            bibBox.classList.remove('hidden');
            let isCheckedIn = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true';
            if (isCheckedIn && p.bibNumber) {
                document.getElementById('resBib').textContent = p.bibNumber;
                document.getElementById('resBibName').textContent = p.bibName;
                document.getElementById('resBib').classList.remove('text-2xl', 'text-blue-300');
                document.getElementById('resBib').classList.add('text-4xl');
            } else {
                document.getElementById('resBib').textContent = "TERKUNCI";
                document.getElementById('resBib').classList.remove('text-4xl');
                document.getElementById('resBib').classList.add('text-2xl', 'text-blue-300');
                document.getElementById('resBibName').textContent = "DIBERIKAN SAAT CHECK-IN";
            }
            const statusQrBox = document.getElementById('statusQrBox');
            const statusQrImg = document.getElementById('statusQrImg');
            if (statusQrBox && statusQrImg) {
                statusQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(p.bibNumber || p.kode)}`;
                statusQrBox.classList.remove('hidden');
            }
        } else { 
            bibBox.classList.add('hidden'); 
            const statusQrBox = document.getElementById('statusQrBox');
            if (statusQrBox) statusQrBox.classList.add('hidden');
        }
        resBox.classList.remove('hidden');
    } else { 
        await window.customAlert("Data peserta tidak ditemukan di sistem!", "error"); 
    }
});

// =====================================================================
// DASHBOARD PUBLIK
// =====================================================================
window.renderPublicParticipants = function() {
    const container = document.getElementById('publicParticipantList');
    if (!container) return;
    const list = State.currentMasterList;
    
    if(!list || list.length === 0) { 
        container.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">Belum ada peserta.</div>'; 
        return; 
    }
    
    const rows = [];
    list.forEach(p => {
        let isCheckedIn = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true';
        let statusBadge = '';
        if (p.status === 'Verified' && isCheckedIn && p.bibNumber) statusBadge = `<span class="font-bold text-blue-600 text-sm">${p.bibNumber}</span>`;
        else if (p.status === 'Verified') statusBadge = `<span class="text-[10px] px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Verified</span>`;
        else statusBadge = `<span class="text-[10px] px-2 py-1 rounded-md bg-slate-100 text-slate-500">Pending</span>`;
        
        rows.push(`
            <div class="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                <div class="flex-1 min-w-0 pr-3">
                    <h4 class="font-bold text-slate-800 text-sm truncate uppercase">${p.nama}</h4>
                    <p class="text-[10px] text-slate-500">${p.kategori}</p>
                </div>
                <div class="text-right flex-shrink-0">${statusBadge}</div>
            </div>`);
    });
    container.innerHTML = rows.join('');
};

window.renderPublikTable = function() {
    const tbody = document.getElementById('publikTableBody');
    if (!tbody) return;
    const keyword = document.getElementById('searchPublikInput') ? document.getElementById('searchPublikInput').value.toLowerCase().trim() : '';
    
    if(!State.currentMasterList || State.currentMasterList.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400 text-xs">Belum ada peserta.</td></tr>'; 
        return; 
    }
    
    const filtered = State.currentMasterList.filter(p => {
        if (keyword === '') return true;
        return (p.nama && p.nama.toLowerCase().includes(keyword)) || 
               (p.kategori && p.kategori.toLowerCase().includes(keyword));
    });

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400 text-xs">Data tidak ditemukan.</td></tr>';
        return;
    }
    
    const rows = [];
    filtered.forEach((p, index) => {
        let logHTML = (p.logistikDiambil && p.logistikDiambil.trim() !== '') ? 
            `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold shadow-sm">Sudah Diambil</span>` : 
            `<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold border">Belum Diambil</span>`;
        
        rows.push(`
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-4 font-bold text-slate-400 text-xs">${index + 1}</td>
                <td class="py-3 px-4 font-bold text-slate-800 uppercase">${p.nama}</td>
                <td class="py-3 px-4 text-slate-600">${p.kategori}</td>
                <td class="py-3 px-4 font-medium text-blue-600">${p.jersey || '-'}</td>
                <td class="py-3 px-4">${logHTML}</td>
            </tr>`);
    });
    tbody.innerHTML = rows.join('');
};

// =====================================================================
// DASHBOARD & ADMIN AREA
// =====================================================================
window.updateDashboardCounters = function() {
    const list = State.currentMasterList;
    let unpaid = 0, pending = 0, verified = 0;
    list.forEach(p => {
        if(p.status === 'Menunggu Pembayaran') unpaid++;
        else if(p.status === 'Menunggu Verifikasi') pending++;
        else if(p.status === 'Verified') verified++;
    });

    const totalEl = document.getElementById('dashTotal');
    if (totalEl) {
        document.getElementById('dashTotal').textContent = list.length;
        document.getElementById('dashUnpaid').textContent = unpaid;
        document.getElementById('dashPending').textContent = pending;
        document.getElementById('dashVerified').textContent = verified;
    }
    
    State.currentHistoryList = list;
    window.renderAdminHistory();
};

window.renderAdminHistory = function() {
    const hList = document.getElementById('adminHistoryList');
    if (!hList) return;
    const kw = document.getElementById('searchHistoryInput') ? document.getElementById('searchHistoryInput').value.toLowerCase().trim() : '';
    
    const filtered = State.currentHistoryList.filter(p => (kw === '' || p.nama?.toLowerCase().includes(kw) || p.kategori?.toLowerCase().includes(kw)));
    if(filtered.length === 0){ 
        hList.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">Tidak ditemukan.</div>'; 
        return;
    }
    
    // Tampilkan 50 terbaru agar sangat ringan dan cepat
    const displayList = kw === '' ? filtered.slice(0, 50) : filtered.slice(0, 100);
    const rows = [];
    displayList.forEach(p => {
        let color = p.status === 'Verified' ? 'text-emerald-600 bg-emerald-50' : (p.status === 'Menunggu Verifikasi' ? 'text-yellow-600 bg-yellow-50' : 'text-slate-500 bg-slate-100');
        rows.push(`
            <div class="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                <div>
                    <p class="font-bold text-slate-800 text-sm">${p.nama} <span class="text-[10px] text-slate-400">(${p.kode})</span></p>
                    <p class="text-xs text-slate-500">${p.kategori}</p>
                </div>
                <span class="text-[10px] px-2 py-1 rounded-md font-semibold ${color}">${p.status}</span>
            </div>`);
    });
    hList.innerHTML = rows.join('');
};

window.renderMasterTable = function() {
    const tbody = document.getElementById('masterTableBody');
    if (!tbody) return;
    const keyword = document.getElementById('searchMasterInput') ? document.getElementById('searchMasterInput').value.toLowerCase().trim() : '';
    
    const filteredList = State.currentMasterList.filter(p => {
        if (keyword === '') return true;
        return (p.nama && p.nama.toLowerCase().includes(keyword)) || 
               (p.bibNumber && p.bibNumber.toLowerCase().includes(keyword)) ||
               (p.kode && p.kode.toLowerCase().includes(keyword));
    });

    if(filteredList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400 text-xs">Data tidak ditemukan.</td></tr>';
        return;
    }
    
    const rows = [];
    filteredList.forEach(p => {
        let btnHTML = '<div class="flex flex-wrap gap-1 justify-end max-w-[170px] ml-auto">';
        
        btnHTML += `<button onclick="openEditPesertaModal('${p.kode}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm active:scale-95 transition">Edit</button>`;

        if (p.bukti && p.bukti !== '') {
            btnHTML += `<button onclick="openVerifyModal('${p.kode}', 'view')" class="bg-slate-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-slate-700 active:scale-95">Bukti</button>`;
        }

        if(p.status === 'Menunggu Verifikasi') {
            btnHTML += `<button onclick="openVerifyModal('${p.kode}', 'verify')" class="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 active:scale-95">Verifikasi</button>`;
        } else if(p.status === 'Verified') {
            btnHTML += `<button onclick="cancelVerifikasi('${p.kode}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-yellow-600 active:scale-95">Batal Verif</button>`;
        }

        btnHTML += `<button onclick="deletePeserta('${p.kode}')" class="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-red-600 active:scale-95">Hapus</button></div>`;
        
        let isCheckedIn = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true';
        let checkInIndicator = isCheckedIn ? '<br><span class="text-[9px] text-emerald-600">✅ Hadir</span>' : '';
        
        let idHTML = p.bibNumber 
            ? `<span class="font-bold text-blue-600 text-sm">${p.bibNumber}</span>${checkInIndicator}` 
            : `<span class="font-mono text-xs text-slate-600">${p.kode}</span>`;
        
        let statusClass = p.status === 'Verified' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-500 border-slate-200';

        rows.push(`
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-3 align-top">${idHTML}</td>
                <td class="py-3 px-3 align-top"><span class="font-bold text-slate-700 text-xs uppercase">${p.bibName || '-'}</span></td>
                <td class="py-3 px-3 align-top">
                    <div class="font-bold text-slate-800 text-sm truncate max-w-[120px] sm:max-w-[200px]">${p.nama}</div>
                    <div class="text-[10px] text-slate-500">${p.kategori} <span class="text-indigo-600 font-bold ml-1">• ${p.jersey || '-'}</span></div>
                </td>
                <td class="py-3 px-3 align-top">
                    <span class="text-[10px] border px-2 py-1 rounded inline-block ${statusClass} leading-none text-center">${p.status}</span>
                </td>
                <td class="py-3 px-3 align-top text-right">${btnHTML}</td>
            </tr>
        `);
    });
    tbody.innerHTML = rows.join('');
};

// =====================================================================
// AKSI ADMIN (VERIFIKASI, HAPUS, EXPORT)
// =====================================================================
window.openVerifyModal = function(kode, mode = 'verify') {
    const p = State.currentMasterList.find(x => x.kode === kode);
    if(!p) return;
    document.getElementById('verifyModalSubtitle').textContent = `${p.nama} - ${kode}`;
    document.getElementById('verifyImage').src = (p.bukti && p.bukti !== '') ? p.bukti : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzk0YTNiOCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UaWRhayBhZGEgZ2FtYmFyIGJ1a3RpPC90ZXh0Pjwvc3ZnPg==";
    
    const questionText = document.getElementById('verifyQuestionText');
    const confirmBtn = document.getElementById('confirmVerifyBtn');
    const closeBtn = document.getElementById('closeVerifyBtn');

    if (mode === 'verify') {
        if(questionText) questionText.textContent = "Apakah bukti transfer ini sudah sesuai (Lunas)?";
        if(closeBtn) closeBtn.textContent = "Batal";
        if(confirmBtn) {
            confirmBtn.style.display = 'block';
            confirmBtn.onclick = () => { window.verifyPeserta(kode); window.closeVerifyModal(); };
        }
    } else {
        if(questionText) questionText.textContent = `Status Pembayaran: ${p.status}`;
        if(closeBtn) closeBtn.textContent = "Tutup";
        if(confirmBtn) confirmBtn.style.display = 'none';
    }

    document.getElementById('verifyModal').classList.remove('hidden');
};

window.closeVerifyModal = function() { document.getElementById('verifyModal').classList.add('hidden'); };

window.verifyPeserta = async function(kode) {
    try { 
        await updatePeserta(kode, { status: 'Verified' }); 
        await window.customAlert(`Peserta ${kode} berhasil diverifikasi!`, "success");
    } catch(e) {
        await window.customAlert("Gagal verifikasi:\n\n" + e.message, "error");
    }
};

window.cancelVerifikasi = async function(kode) {
    const isConfirmed = await window.customConfirm(`Yakin ingin <strong>MEMBATALKAN</strong> verifikasi untuk kode <strong>${kode}</strong>?`, "Batal Verifikasi");
    if(!isConfirmed) return;
    
    try { 
        await updatePeserta(kode, { 
            status: 'Menunggu Verifikasi', 
            checkedIn: false, 
            kodeLogistik: '', 
            logistikDiambil: '' 
        }); 
    } catch(e) { 
        await window.customAlert("Gagal membatalkan verifikasi: " + e.message, "error"); 
    }
};

window.deletePeserta = async function(kode) {
    const isConfirmed = await window.customConfirm(`Yakin ingin <strong>MENGHAPUS</strong> peserta dengan kode <strong>${kode}</strong>?<br>Data tidak dapat dikembalikan.`, "Hapus Peserta");
    if(!isConfirmed) return;
    
    try { 
        await deletePesertaRecord(kode); 
    } catch(e) {
        await window.customAlert("Gagal menghapus: " + e.message, "error");
    }
};

window.openEditPesertaModal = function(kode) {
    const p = State.currentMasterList.find(x => x.kode === kode);
    if (!p) return;

    document.getElementById('editKode').value = p.kode;
    document.getElementById('editModalSubtitle').textContent = `Kode: ${p.kode} • BIB: ${p.bibNumber || '-'}`;
    document.getElementById('editNama').value = p.nama || '';
    
    // Set Ukuran Jersey
    const jerseySelect = document.getElementById('editJersey');
    if (jerseySelect) {
        jerseySelect.value = p.jersey ? p.jersey.trim() : '';
    }

    // Set Kategori Lomba
    const katSelect = document.getElementById('editKategori');
    if (katSelect) {
        katSelect.innerHTML = '';
        const listKat = (State.settings && State.settings.kategori) 
            ? State.settings.kategori.split('\n').map(k => k.trim()).filter(Boolean) 
            : ['5K Umum', '10K Umum', '10K Master'];
        
        // Pastikan kategori peserta saat ini ada di opsi
        if (p.kategori && !listKat.includes(p.kategori.trim())) {
            listKat.push(p.kategori.trim());
        }

        listKat.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = k;
            if (k === (p.kategori ? p.kategori.trim() : '')) opt.selected = true;
            katSelect.appendChild(opt);
        });
    }

    document.getElementById('editStatus').value = p.status || 'Menunggu Pembayaran';
    document.getElementById('editBibName').value = p.bibName || '';
    document.getElementById('editBibNumber').value = p.bibNumber || '';
    document.getElementById('editWa').value = p.wa || p.telepon || '';

    document.getElementById('editPesertaModal').classList.remove('hidden');
};

window.closeEditPesertaModal = function() {
    const modal = document.getElementById('editPesertaModal');
    if (modal) modal.classList.add('hidden');
};

window.saveEditPeserta = async function(event) {
    event.preventDefault();
    const kode = document.getElementById('editKode').value;
    if (!kode) return;

    const nama = document.getElementById('editNama').value.trim().toUpperCase();
    const jersey = document.getElementById('editJersey').value;
    const kategori = document.getElementById('editKategori').value;
    const status = document.getElementById('editStatus').value;
    const bibName = document.getElementById('editBibName').value.trim().toUpperCase();
    const bibNumber = document.getElementById('editBibNumber').value.trim();
    const wa = document.getElementById('editWa').value.trim();

    const saveBtn = document.getElementById('btnSaveEditPeserta');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>Menyimpan...</span>';
    }

    try {
        const updateData = {
            nama,
            jersey,
            kategori,
            status,
            bibName,
            bibNumber,
            wa
        };

        // Simpan langsung ke Firestore & Local
        await updatePeserta(kode, updateData);

        // Update objek di memory
        const pIndex = State.currentMasterList.findIndex(x => x.kode === kode);
        if (pIndex !== -1) {
            State.currentMasterList[pIndex] = Object.assign({}, State.currentMasterList[pIndex], updateData);
        }

        window.closeEditPesertaModal();
        refreshActivePageUI();

        await window.customAlert(`Data peserta <strong>${nama}</strong> berhasil diperbarui!<br><br>Ukuran Jersey: <strong>${jersey}</strong>`, "success", "Berhasil Disimpan");
    } catch(err) {
        await window.customAlert("Gagal menyimpan perubahan:<br><br>" + err.message, "error", "Gagal");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
};

window.exportToExcel = function() {
    const list = State.currentMasterList;
    if (!list || list.length === 0) {
        window.customAlert("Belum ada data peserta untuk diunduh.", "warning", "Data Kosong");
        return;
    }

    const cols = [
        'kode', 'nama', 'ktp', 'gender', 'kategori', 'bibName', 'wa', 'jersey',
        'komunitas', 'alamat', 'provinsi', 'kota', 'darurat', 'komorbid',
        'tagihan', 'diskon', 'status', 'bibNumber', 'checkedIn',
        'kodeLogistik', 'logistikDiambil', 'bukti', 'createdAt'
    ];

    if (window.XLSX) {
        // Buat file Excel (.xlsx) ASLI dengan SheetJS
        const dataForSheet = list.map(p => {
            const obj = {};
            cols.forEach(c => {
                let val = p[c] !== undefined && p[c] !== null ? p[c] : '';
                if (c === 'ktp') {
                    val = String(val).trim();
                } else if (c === 'wa' || c === 'darurat') {
                    let s = String(val).trim();
                    if (s && !s.startsWith('0') && !s.startsWith('+')) s = '0' + s;
                    val = s;
                } else if (c === 'bukti') {
                    val = val ? '[Ada Bukti Transfer]' : '[Tidak Ada Bukti]';
                } else if (c === 'checkedIn') {
                    val = (val === true || val === 'TRUE' || val === 'true') ? 'TRUE' : 'FALSE';
                } else if (c === 'createdAt') {
                    if (typeof val === 'number' && val > 1000000000) {
                        try {
                            const ts = val > 100000000000 ? val : val * 1000;
                            const d = new Date(ts);
                            val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
                        } catch(e) {}
                    }
                } else if (typeof val === 'string') {
                    val = val.replace(/\r?\n|\r/g, ' ').trim();
                }
                obj[c] = val;
            });
            return obj;
        });

        const ws = XLSX.utils.json_to_sheet(dataForSheet, { header: cols });

        // Set Lebar Kolom Otomatis
        const colWidths = cols.map(col => {
            let maxL = col.length;
            dataForSheet.slice(0, 100).forEach(row => {
                const valL = String(row[col] || '').length;
                if (valL > maxL) maxL = valL;
            });
            return { wch: Math.min(Math.max(maxL + 3, 10), 40) };
        });
        ws['!cols'] = colWidths;

        // Pastikan kolom NIK & WA berupa teks agar tidak terpotong ilmiah
        const range = XLSX.utils.decode_range(ws['!ref']);
        const textCols = [cols.indexOf('ktp'), cols.indexOf('wa'), cols.indexOf('darurat')];
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            textCols.forEach(C => {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[cellRef]) {
                    ws[cellRef].t = 's';
                    ws[cellRef].z = '@';
                }
            });
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Peserta ACR 2026");

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        XLSX.writeFile(wb, `database_peserta_acr2026_${dateStr}.xlsx`);
    } else {
        // Fallback jika library belum termuat
        window.exportToCSV();
    }
};

window.exportToCSV = function() {
    const list = State.currentMasterList;
    if (!list || list.length === 0) {
        window.customAlert("Belum ada data peserta untuk diunduh.", "warning", "Data Kosong");
        return;
    }

    const cols = [
        'kode', 'nama', 'ktp', 'gender', 'kategori', 'bibName', 'wa', 'jersey',
        'komunitas', 'alamat', 'provinsi', 'kota', 'darurat', 'komorbid',
        'tagihan', 'diskon', 'status', 'bibNumber', 'checkedIn',
        'kodeLogistik', 'logistikDiambil', 'bukti', 'createdAt'
    ];

    const rows = [];
    rows.push(cols.join(','));

    list.forEach(p => {
        const row = cols.map(c => {
            let val = p[c] !== undefined && p[c] !== null ? p[c] : '';
            
            if (c === 'ktp') {
                // Cegah Excel mengubah NIK jadi notasi ilmiah
                val = val ? `"=""${val}"""` : '""';
            } else if (c === 'wa' || c === 'darurat') {
                let valStr = String(val).trim();
                if (valStr && !valStr.startsWith('0') && !valStr.startsWith('+')) {
                    valStr = '0' + valStr;
                }
                val = valStr ? `"=""${valStr}"""` : '""';
            } else if (c === 'bukti') {
                val = val ? '"[Ada Bukti]"' : '"[Tidak Ada Bukti]"';
            } else if (c === 'checkedIn') {
                val = (val === true || val === 'TRUE' || val === 'true') ? '"TRUE"' : '"FALSE"';
            } else if (c === 'createdAt') {
                if (typeof val === 'number' && val > 1000000000) {
                    try {
                        const ts = val > 100000000000 ? val : val * 1000;
                        const d = new Date(ts);
                        val = `"${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}"`;
                    } catch(e) {
                        val = `"${val}"`;
                    }
                } else {
                    val = `"${val}"`;
                }
            } else {
                let s = String(val).replace(/\r?\n|\r/g, ' ').replace(/"/g, '""').trim();
                val = `"${s}"`;
            }
            return val;
        });
        rows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `database_peserta_acr2026_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

window.exportToPDF = async function() {
    window.showLoading(true, "Membuat PDF...");
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'pt', 'a4'); 

        const s = State.settings;
        const title = s.judul ? s.judul.replace(/\n/g, ' ') : 'Alpha Chase Run';
        const date = formatDisplayDate(s.tanggal) || '-';
        const loc = s.lokasi || '-';
        const wa = s.waPanitia || '-';

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, doc.internal.pageSize.width / 2, 40, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tanggal: ${date} | Lokasi: ${loc} | WA Panitia: ${wa}`, doc.internal.pageSize.width / 2, 60, { align: 'center' });
        
        doc.setLineWidth(1);
        doc.line(40, 75, doc.internal.pageSize.width - 40, 75);

        const keyword = document.getElementById('searchMasterInput') ? document.getElementById('searchMasterInput').value.toLowerCase().trim() : '';
        const filteredList = State.currentMasterList.filter(p => {
            if (keyword === '') return true;
            return (p.nama && p.nama.toLowerCase().includes(keyword)) || 
                   (p.bibNumber && p.bibNumber.toLowerCase().includes(keyword)) ||
                   (p.kode && p.kode.toLowerCase().includes(keyword));
        });

        const tableData = filteredList.map((p, i) => [
            i + 1, p.kode, p.bibNumber || '-', p.bibName || '-', p.nama,
            p.gender === 'L' ? 'Laki-laki' : 'Perempuan', p.wa || '-', p.kategori,
            p.jersey || '-', p.status, (p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true') ? 'Hadir' : '-'
        ]);

        doc.autoTable({
            startY: 85,
            head: [['No', 'Kode', 'BIB', 'Nama BIB', 'Nama Lengkap', 'Gender', 'No. WA', 'Kategori', 'Jersey', 'Status', 'Check-In']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save('Data_Peserta_Alpha_Chase_Run.pdf');
    } catch(e) { 
        await window.customAlert("Gagal membuat PDF: " + e.message, "error"); 
    }
    window.showLoading(false);
};

// =====================================================================
// CHECK-IN & LOGISTIK ADMIN
// =====================================================================
document.getElementById('formCheckin').addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputVal = document.getElementById('checkinKode').value.toUpperCase().trim();
    
    // Cari berdasarkan Kode Pendaftaran ATAU Nomor BIB
    let p = State.currentMasterList.find(x => x.kode === inputVal || (x.bibNumber && x.bibNumber.toUpperCase() === inputVal));

    if (!p) {
        await window.customAlert("Kode Pendaftaran atau Nomor BIB tidak ditemukan di sistem!", "error");
        return;
    }

    if (p.status !== 'Verified') {
        await window.customAlert(`Peserta <strong>${p.nama}</strong> (${p.kode}) belum diverifikasi pembayarannya.<br>Harap verifikasi terlebih dahulu di menu Master.`, "warning", "Belum Diverifikasi");
        return;
    }

    const isAlreadyChecked = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true' || (p.kodeLogistik && p.kodeLogistik.trim() !== '');

    if (isAlreadyChecked && p.kodeLogistik) {
        // Jika sudah pernah check-in, gunakan kode logistik yang sama (tidak boleh buat kode baru/dobel!)
        document.getElementById('ciResNama').textContent = p.nama;
        document.getElementById('ciResKat').textContent = (p.kategori || '').replace(/\s*\([^)]*\)/g, '').trim();
        document.getElementById('ciResBib').textContent = p.bibNumber;
        document.getElementById('logistikCodeDisplay').textContent = p.kodeLogistik;
        document.getElementById('qrCodeImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${p.kodeLogistik}`;
        document.getElementById('checkinSuccessModal').classList.remove('hidden');
        this.reset();
        await window.customAlert(`Peserta <strong>${p.nama}</strong> sudah check-in sebelumnya dengan kode: <strong class="text-blue-600 text-lg">${p.kodeLogistik}</strong>.<br><br>Kode yang sama telah dimuat untuk cetak ulang.`, "info", "Sudah Check-In");
        return;
    }

    // HITUNG KODE LOGISTIK SECARA KETAT & URUT (ANTI-DUPLIKAT)
    // Kumpulkan seluruh nomor yang sudah terpakai oleh peserta mana pun
    const usedNumbers = new Set();
    State.currentMasterList.forEach(item => {
        if (item.kodeLogistik && typeof item.kodeLogistik === 'string') {
            const match = item.kodeLogistik.match(/\d+/);
            if (match) {
                usedNumbers.add(parseInt(match[0], 10));
            }
        }
    });

    // Cari nomor urut terkecil yang belum pernah dipakai sama sekali
    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
        nextNum++;
    }

    const logCode = "LOG-" + String(nextNum).padStart(3, '0');

    document.getElementById('ciResNama').textContent = p.nama;
    document.getElementById('ciResKat').textContent = (p.kategori || '').replace(/\s*\([^)]*\)/g, '').trim();
    document.getElementById('ciResBib').textContent = p.bibNumber;
    document.getElementById('logistikCodeDisplay').textContent = logCode;
    document.getElementById('qrCodeImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${logCode}`;
    document.getElementById('checkinSuccessModal').classList.remove('hidden');
    this.reset();

    // Simpan ke Firestore dan perbarui data lokal
    p.checkedIn = true;
    p.kodeLogistik = logCode;
    p.logistikDiambil = "";

    await updatePeserta(p.kode, { 
        checkedIn: true, 
        kodeLogistik: logCode, 
        logistikDiambil: "" 
    });

    refreshActivePageUI();
});

window.closeCheckinModal = function() { document.getElementById('checkinSuccessModal').classList.add('hidden'); };

window.renderCheckinHistory = function() {
    const container = document.getElementById('checkinHistoryList');
    if(!container) return;
    
    const list = State.currentMasterList.filter(p => p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true');
    list.sort((a, b) => {
        let numA = parseInt((a.kodeLogistik || '0').replace(/\D/g, '')) || 0;
        let numB = parseInt((b.kodeLogistik || '0').replace(/\D/g, '')) || 0;
        return numB - numA;
    });

    container.innerHTML = '';
    if(list.length === 0) {
        container.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">Belum ada peserta yang melakukan Check-In.</div>';
        return;
    }

    const rows = [];
    list.forEach(p => {
        rows.push(`
            <div class="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                <div class="flex-1 min-w-0 pr-2">
                    <p class="font-bold text-slate-800 text-sm truncate">${p.nama} <span class="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded ml-1 border border-emerald-200">Hadir</span></p>
                    <p class="text-xs text-slate-500 truncate">${p.kategori} | BIB: <span class="font-bold text-blue-600">${p.bibNumber || '-'}</span></p>
                </div>
                <div class="text-right flex-col items-end flex-shrink-0">
                    <span class="text-[10px] text-slate-500">KODE LOGISTIK</span>
                    <span class="text-sm font-black text-blue-700 tracking-widest">${p.kodeLogistik || '-'}</span>
                </div>
            </div>`);
    });
    container.innerHTML = rows.join('');
};

window.printLogistik = function() {
    const qrSrc = document.getElementById('qrCodeImage').src;
    const logCode = document.getElementById('logistikCodeDisplay').textContent;
    const nama = document.getElementById('ciResNama').textContent;
    const kat = document.getElementById('ciResKat').textContent;
    const bib = document.getElementById('ciResBib').textContent;
    const printWin = window.open('', '_blank', 'width=400,height=600');
    printWin.document.write(`
        <html><head><title>Print Struk</title><style>
            body { font-family: monospace; text-align: center; padding: 20px; color: #000; }
            .ticket { border: 2px dashed #000; padding: 20px; display: inline-block; max-width: 300px; width: 100%; margin: 0 auto; }
            img { width: 150px; height: 150px; margin-bottom: 10px; }
            h2 { margin: 0; font-size: 20px; text-transform: uppercase;}
            h1 { margin: 5px 0; font-size: 32px; letter-spacing: 2px; }
            p { margin: 5px 0; font-size: 14px; text-align: left; }
            hr { border-top: 1px dashed #000; margin: 15px 0; }
        </style></head><body>
        <div class="ticket">
            <h2>KODE LOGISTIK</h2><img src="${qrSrc}" /><h1>${logCode}</h1><hr/>
            <p><strong>NAMA:</strong> ${nama}</p><p><strong>KATEGORI:</strong> ${kat}</p><p><strong>BIB:</strong> ${bib}</p><hr/>
            <p style="text-align:center; font-size:10px;">Serahkan struk ini ke bagian pengambilan logistik.</p>
        </div><script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); }<\/script>
        </body></html>`);
    printWin.document.close();
};

document.getElementById('formLogistik').addEventListener('submit', async function(e) {
    e.preventDefault();
    const kodeLogistik = document.getElementById('inputKodeLogistik').value.toUpperCase().trim();
    let p = State.currentMasterList.find(x => x.kodeLogistik === kodeLogistik);
    
    if(p) {
        document.getElementById('logResNama').textContent = p.nama;
        document.getElementById('logResDetail').textContent = p.kategori + ' | BIB: ' + p.bibNumber;
        document.getElementById('logResJersey').textContent = p.jersey || '-';
        document.getElementById('logResBib').textContent = p.bibNumber;
        document.getElementById('currentLogKode').value = p.kode; 
        
        document.getElementById('chkJersey').checked = false;
        document.getElementById('chkBib').checked = false;
        document.getElementById('chkTas').checked = false;
        
        if (p.logistikDiambil) {
            if (p.logistikDiambil.includes('Jersey')) document.getElementById('chkJersey').checked = true;
            if (p.logistikDiambil.includes('Nomor BIB')) document.getElementById('chkBib').checked = true;
            if (p.logistikDiambil.includes('Tas Serut')) document.getElementById('chkTas').checked = true;
        }
        document.getElementById('logistikModal').classList.remove('hidden');
    } else { 
        await window.customAlert('Kode Logistik tidak valid atau peserta belum melakukan Check-in.', 'error'); 
    }
});

window.closeLogistikModal = function() { document.getElementById('logistikModal').classList.add('hidden'); };

window.saveLogistikItems = async function() {
    const docId = document.getElementById('currentLogKode').value;
    let items = [];
    if(document.getElementById('chkJersey').checked) items.push('Jersey');
    if(document.getElementById('chkBib').checked) items.push('Nomor BIB');
    if(document.getElementById('chkTas').checked) items.push('Tas Serut');
    
    window.closeLogistikModal();
    document.getElementById('inputKodeLogistik').value = '';
    
    await updatePeserta(docId, { logistikDiambil: items.join(', ') });
    await window.customAlert("Data pengambilan logistik berhasil dicatat!", "success");
};

window.editLogistik = function(kodeLogistik) {
    document.getElementById('inputKodeLogistik').value = kodeLogistik;
    const p = State.currentMasterList.find(x => x.kodeLogistik === kodeLogistik);
    if(p) {
        document.getElementById('logResNama').textContent = p.nama;
        document.getElementById('logResDetail').textContent = p.kategori + ' | BIB: ' + p.bibNumber;
        document.getElementById('logResJersey').textContent = p.jersey || '-';
        document.getElementById('logResBib').textContent = p.bibNumber;
        document.getElementById('currentLogKode').value = p.kode; 
        
        document.getElementById('chkJersey').checked = false;
        document.getElementById('chkBib').checked = false;
        document.getElementById('chkTas').checked = false;
        
        if (p.logistikDiambil) {
            if (p.logistikDiambil.includes('Jersey')) document.getElementById('chkJersey').checked = true;
            if (p.logistikDiambil.includes('Nomor BIB')) document.getElementById('chkBib').checked = true;
            if (p.logistikDiambil.includes('Tas Serut')) document.getElementById('chkTas').checked = true;
        }
        document.getElementById('logistikModal').classList.remove('hidden');
    }
};

window.deleteLogistikHistory = async function(kode) {
    const isConfirmed = await window.customConfirm("Yakin ingin menghapus riwayat pengambilan logistik ini? <br><br>Data barang akan di-reset menjadi <strong>belum diambil</strong>.", "Hapus Riwayat");
    if(!isConfirmed) return;

    await updatePeserta(kode, { logistikDiambil: "" });
};

window.renderLogistikData = function() {
    const list = State.currentMasterList;
    const jerseyCount = { 'Lainnya': 0 };
    const katCount = {};
    let historyHtml = '';

    list.forEach(p => {
        let j = p.jersey ? p.jersey.trim() : '';
        if (j) {
            if (jerseyCount[j] === undefined) jerseyCount[j] = 0;
            jerseyCount[j]++;
        } else { jerseyCount['Lainnya']++; }
        
        let k = p.kategori ? p.kategori.trim() : 'Tidak Diketahui';
        if (!katCount[k]) katCount[k] = 0; katCount[k]++;
        
        if (p.logistikDiambil && p.logistikDiambil.trim() !== '') {
            historyHtml += `
                <div class="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2 hover:shadow-sm transition">
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-bold text-slate-800 text-sm">${p.nama} <span class="text-[10px] font-normal text-slate-500">(${p.bibNumber})</span></span>
                        <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">${p.kodeLogistik||'LOG'}</span>
                    </div>
                    <p class="text-xs text-emerald-600 font-medium mb-2">Diambil: ${p.logistikDiambil}</p>
                    <div class="flex space-x-2 mt-auto justify-end border-t border-slate-100 pt-2">
                        <button onclick="editLogistik('${p.kodeLogistik}')" class="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-lg hover:bg-yellow-200 transition">Edit</button>
                        <button onclick="deleteLogistikHistory('${p.kode}')" class="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-200 transition">Hapus</button>
                    </div>
                </div>`;
        }
    });

    let jHtml = '';
    for (let size in jerseyCount) {
        if (size !== 'Lainnya' || jerseyCount[size] > 0) {
            const encSize = encodeURIComponent(size).replace(/'/g, "%27");
            jHtml += `
                <div onclick="showJerseyParticipantsModal('${encSize}')" class="flex justify-between items-center bg-slate-50 hover:bg-blue-50/90 hover:border-blue-300 p-3 sm:p-3.5 mb-2.5 rounded-2xl border border-slate-200/80 cursor-pointer transition shadow-sm hover:shadow active:scale-[0.99] group">
                    <div class="flex items-center space-x-2.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition"></span>
                        <span class="font-bold text-slate-800 group-hover:text-blue-700 text-sm sm:text-base">Ukuran ${size}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-800 py-1 px-3.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm">${jerseyCount[size]}</span>
                        <span class="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                            <span class="hidden sm:inline">Lihat Peserta</span>
                            <span>➔</span>
                        </span>
                    </div>
                </div>`;
        }
    }
    document.getElementById('logistikJersey').innerHTML = list.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs">Belum ada data pendaftar.</div>' : jHtml;

    let kHtml = '';
    for (let kat in katCount) {
        const encKat = encodeURIComponent(kat).replace(/'/g, "%27");
        kHtml += `
            <div onclick="showCategoryParticipantsModal('${encKat}')" class="flex justify-between items-center bg-slate-50 hover:bg-emerald-50/90 hover:border-emerald-300 p-3 sm:p-3.5 mb-2.5 rounded-2xl border border-slate-200/80 cursor-pointer transition shadow-sm hover:shadow active:scale-[0.99] group">
                <div class="flex items-center space-x-2.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition"></span>
                    <span class="font-bold text-slate-800 group-hover:text-emerald-700 text-sm sm:text-base">${kat}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 py-1 px-3.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm">${katCount[kat]}</span>
                    <span class="text-xs text-emerald-600 font-semibold group-hover:underline flex items-center gap-1">
                        <span class="hidden sm:inline">Lihat Peserta</span>
                        <span>➔</span>
                    </span>
                </div>
            </div>`;
    }
    document.getElementById('logistikKategori').innerHTML = list.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs">Belum ada data pendaftar.</div>' : kHtml;
    document.getElementById('logistikHistoryList').innerHTML = historyHtml === '' ? '<div class="text-center py-6 text-slate-400 text-xs">Belum ada riwayat pengambilan.</div>' : historyHtml;
};

// =====================================================================
// POPUP DETAIL PESERTA PER KATEGORI & UKURAN JERSEY
// =====================================================================
State.currentCategoryModalList = [];
State.currentCategoryModalTitle = '';

window.showCategoryParticipantsModal = function(encodedKat) {
    try {
        const kat = decodeURIComponent(encodedKat).trim();
        const masterList = State.currentMasterList || [];

        // Cocokkan persis dulu sesuai teks kategori
        let list = masterList.filter(p => {
            const pKat = String(p.kategori || '').trim();
            return pKat === kat || (pKat === '' && kat === 'Tidak Diketahui');
        });
        // Fallback case-insensitive bila tidak ditemukan
        if (list.length === 0) {
            list = masterList.filter(p => {
                const pKat = String(p.kategori || '').trim();
                return pKat.toLowerCase() === kat.toLowerCase();
            });
        }

        State.currentCategoryModalList = list;
        State.currentCategoryModalTitle = `Kategori: ${kat}`;

        const titleEl = document.getElementById('catModalTitle');
        const subEl = document.getElementById('catModalSubtitle');
        const modalEl = document.getElementById('categoryPesertaModal');

        if (titleEl) titleEl.textContent = `Peserta ${kat}`;
        if (subEl) subEl.textContent = `Total: ${list.length} Peserta Terdaftar`;
        const searchInput = document.getElementById('catModalSearch');
        if (searchInput) searchInput.value = '';

        renderCatModalRows(list);
        if (modalEl) {
            modalEl.classList.remove('hidden');
            const scrollableBody = modalEl.querySelector('.overflow-y-auto');
            if (scrollableBody) scrollableBody.scrollTop = 0;
        }
    } catch (err) {
        console.error("Error opening category participants modal:", err);
    }
};

window.showJerseyParticipantsModal = function(encodedSize) {
    try {
        const size = decodeURIComponent(encodedSize).trim();
        const masterList = State.currentMasterList || [];

        // Cocokkan persis dulu sesuai ukuran jersey
        let list = masterList.filter(p => {
            const pJersey = String(p.jersey || '').trim();
            return pJersey === size || (pJersey === '' && size === 'Lainnya');
        });
        // Fallback case-insensitive bila tidak ditemukan
        if (list.length === 0) {
            list = masterList.filter(p => {
                const pJersey = String(p.jersey || '').trim();
                return pJersey.toLowerCase() === size.toLowerCase();
            });
        }

        State.currentCategoryModalList = list;
        State.currentCategoryModalTitle = `Ukuran Jersey: ${size}`;

        const titleEl = document.getElementById('catModalTitle');
        const subEl = document.getElementById('catModalSubtitle');
        const modalEl = document.getElementById('categoryPesertaModal');

        if (titleEl) titleEl.textContent = `Peserta Ukuran Jersey ${size}`;
        if (subEl) subEl.textContent = `Total: ${list.length} Peserta Memilih Ukuran Ini`;
        const searchInput = document.getElementById('catModalSearch');
        if (searchInput) searchInput.value = '';

        renderCatModalRows(list);
        if (modalEl) {
            modalEl.classList.remove('hidden');
            const scrollableBody = modalEl.querySelector('.overflow-y-auto');
            if (scrollableBody) scrollableBody.scrollTop = 0;
        }
    } catch (err) {
        console.error("Error opening jersey participants modal:", err);
    }
};

window.closeCategoryPesertaModal = function() {
    const modal = document.getElementById('categoryPesertaModal');
    if (modal) modal.classList.add('hidden');
};

// Tutup modal peserta dengan tombol ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('categoryPesertaModal');
        if (modal && !modal.classList.contains('hidden')) {
            window.closeCategoryPesertaModal();
        }
    }
});

window.filterCatModalList = function(keyword) {
    const q = String(keyword || '').toLowerCase().trim();
    if (!State.currentCategoryModalList) return;

    if (!q) {
        renderCatModalRows(State.currentCategoryModalList);
        return;
    }

    const filtered = State.currentCategoryModalList.filter(p => {
        const nama = String(p.nama || '').toLowerCase();
        const bib = String(p.bibNumber || '').toLowerCase();
        const kode = String(p.kode || '').toLowerCase();
        const bibName = String(p.bibName || '').toLowerCase();
        const wa = String(p.wa || '').toLowerCase();
        const kat = String(p.kategori || '').toLowerCase();
        const jersey = String(p.jersey || '').toLowerCase();
        return nama.includes(q) || bib.includes(q) || kode.includes(q) || bibName.includes(q) || wa.includes(q) || kat.includes(q) || jersey.includes(q);
    });

    renderCatModalRows(filtered);
};

function renderCatModalRows(list) {
    const tbody = document.getElementById('catModalTableBody');
    const counter = document.getElementById('catModalFilteredCount');
    if (counter) counter.textContent = `Menampilkan ${list ? list.length : 0} peserta`;

    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-medium">Tidak ada peserta yang cocok dengan pencarian.</td></tr>`;
        return;
    }

    const rows = list.map((p, idx) => {
        const status = String(p.status || 'Pending');
        const statusBadge = status.toLowerCase() === 'verified'
            ? `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">Verified</span>`
            : `<span class="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold">${status}</span>`;

        let waLink = '-';
        if (p.wa !== undefined && p.wa !== null && String(p.wa).trim() !== '' && String(p.wa).trim() !== '#ERROR!') {
            const rawWa = String(p.wa).trim();
            let cleanDigits = rawWa.replace(/\D/g, '');
            if (cleanDigits.length > 0) {
                if (cleanDigits.startsWith('0')) {
                    cleanDigits = '62' + cleanDigits.slice(1);
                } else if (cleanDigits.startsWith('8')) {
                    cleanDigits = '62' + cleanDigits;
                }
                waLink = `<a href="https://wa.me/${cleanDigits}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline flex items-center gap-1">${rawWa}</a>`;
            } else {
                waLink = rawWa;
            }
        }

        const nama = String(p.nama || '-');
        const bibNumber = String(p.bibNumber || '-');
        const kode = String(p.kode || '');
        const bibName = p.bibName ? `• ${p.bibName}` : '';
        const kategori = String(p.kategori || '-');
        const jersey = String(p.jersey || '-');

        return `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="py-3 px-3.5 text-center font-bold text-slate-400">${idx + 1}</td>
                <td class="py-3 px-3.5">
                    <span class="font-mono font-black text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-100">${bibNumber}</span>
                </td>
                <td class="py-3 px-3.5">
                    <div class="font-bold text-slate-800 uppercase">${nama}</div>
                    <div class="text-[11px] text-slate-400 font-mono">${kode} ${bibName}</div>
                </td>
                <td class="py-3 px-3.5 text-slate-600">
                    <div class="font-medium">${kategori}</div>
                    <div class="text-[11px] text-slate-400">Jersey: <strong class="text-slate-700">${jersey}</strong></div>
                </td>
                <td class="py-3 px-3.5 text-center">${statusBadge}</td>
                <td class="py-3 px-3.5">${waLink}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join('');
}

window.exportCategoryListToExcel = function() {
    const list = State.currentCategoryModalList;
    if (!list || list.length === 0) {
        window.customAlert("Tidak ada data untuk di-download!", "warning", "Data Kosong");
        return;
    }

    const title = State.currentCategoryModalTitle || "Kategori";
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

    const headers = [
        'No', 'Kode', 'Nomor BIB', 'Nama Lengkap', 'Nama di BIB', 'Kategori', 'Ukuran Jersey', 'Status', 'WhatsApp', 'Komunitas', 'Kota'
    ];

    const dataRows = list.map((p, idx) => [
        idx + 1,
        p.kode ? String(p.kode) : '',
        p.bibNumber ? String(p.bibNumber) : '',
        p.nama ? String(p.nama) : '',
        p.bibName ? String(p.bibName) : '',
        p.kategori ? String(p.kategori) : '',
        p.jersey ? String(p.jersey) : '',
        p.status ? String(p.status) : '',
        p.wa ? String(p.wa) : '',
        p.komunitas ? String(p.komunitas) : '',
        p.kota ? String(p.kota) : ''
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Peserta");
    XLSX.writeFile(wb, `Peserta_${cleanTitle}.xlsx`);
};

// =====================================================================
// DIALOG KONFIGURASI FIREBASE DI APLIKASI
// =====================================================================
window.openFirebaseModal = function() {
    const modal = document.getElementById('firebaseConfigModal');
    if (!modal) return;
    const cfg = window.FirebaseBridge ? window.FirebaseBridge.getConfig() : {};
    document.getElementById('cfgApiKey').value = cfg.apiKey || '';
    document.getElementById('cfgAuthDomain').value = cfg.authDomain || '';
    document.getElementById('cfgProjectId').value = cfg.projectId || '';
    document.getElementById('cfgStorageBucket').value = cfg.storageBucket || '';
    document.getElementById('cfgMessagingSenderId').value = cfg.messagingSenderId || '';
    document.getElementById('cfgAppId').value = cfg.appId || '';
    modal.classList.remove('hidden');
};

window.closeFirebaseModal = function() {
    const modal = document.getElementById('firebaseConfigModal');
    if (modal) modal.classList.add('hidden');
};

window.saveFirebaseConfigFromUI = async function(e) {
    if(e) e.preventDefault();
    const newConfig = {
        apiKey: document.getElementById('cfgApiKey').value.trim(),
        authDomain: document.getElementById('cfgAuthDomain').value.trim(),
        projectId: document.getElementById('cfgProjectId').value.trim(),
        storageBucket: document.getElementById('cfgStorageBucket').value.trim(),
        messagingSenderId: document.getElementById('cfgMessagingSenderId').value.trim(),
        appId: document.getElementById('cfgAppId').value.trim()
    };

    if (!newConfig.apiKey || !newConfig.projectId) {
        await window.customAlert("API Key dan Project ID wajib diisi!", "warning");
        return;
    }

    try {
        window.FirebaseBridge.saveConfig(newConfig);
        window.closeFirebaseModal();
        await window.customAlert("Konfigurasi Firebase berhasil disimpan! Aplikasi akan menghubungkan ulang.", "success");
        window.FirebaseBridge.init();
        setupFirestoreListeners();
        checkFirebaseBanner();
    } catch(err) {
        await window.customAlert("Gagal menyimpan konfigurasi: " + err.message, "error");
    }
};

window.parseFirebaseSnippet = function() {
    const snippet = document.getElementById('cfgSnippet').value;
    if (!snippet) return;
    try {
        const extract = (key) => {
            const m = snippet.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
            return m ? m[1] : '';
        };
        const apiKey = extract('apiKey');
        const authDomain = extract('authDomain');
        const projectId = extract('projectId');
        const storageBucket = extract('storageBucket');
        const messagingSenderId = extract('messagingSenderId');
        const appId = extract('appId');

        if (apiKey) document.getElementById('cfgApiKey').value = apiKey;
        if (authDomain) document.getElementById('cfgAuthDomain').value = authDomain;
        if (projectId) document.getElementById('cfgProjectId').value = projectId;
        if (storageBucket) document.getElementById('cfgStorageBucket').value = storageBucket;
        if (messagingSenderId) document.getElementById('cfgMessagingSenderId').value = messagingSenderId;
        if (appId) document.getElementById('cfgAppId').value = appId;

        window.customAlert("Snippet konfigurasi berhasil diekstrak ke formulir!", "success");
    } catch(e) {
        window.customAlert("Gagal membaca snippet: " + e.message, "error");
    }
};

function checkFirebaseBanner() {
    const alertEl = document.getElementById('apiAlert');
    if (alertEl) alertEl.classList.add('hidden');
}

// =====================================================================
// SINKRONISASI SEED / LEGACY DATA & FIRESTORE
// =====================================================================
function loadSeedDataIfEmpty() {
    if (window.LEGACY_SEED) {
        const data = window.LEGACY_SEED;
        if (Array.isArray(data.peserta) && data.peserta.length > 0) {
            if (State.currentMasterList.length === 0) {
                State.currentMasterList = data.peserta.slice();
            }
        }
        if (data.settings) {
            const s = Object.assign({}, data.settings);
            if (s.waPanitia === '#ERROR!' || !s.waPanitia) s.waPanitia = '6281234567890';
            State.settings = Object.assign({}, State.settings, s);
        }
        return;
    }
    if (State.currentMasterList.length === 0) {
        try {
            fetch('data/legacy_seed.json')
                .then(res => res.json())
                .then(data => {
                    if (data.peserta && State.currentMasterList.length === 0) {
                        State.currentMasterList = data.peserta;
                    }
                    if (data.settings) {
                        State.settings = Object.assign({}, State.settings, data.settings);
                    }
                    refreshActivePageUI();
                })
                .catch(console.warn);
        } catch(err) {
            console.warn("Gagal memuat legacy_seed.json:", err);
        }
    }
}

function restoreAdminRole() {
    const savedRole = sessionStorage.getItem('acr_role');
    const adminMenus = document.getElementById('adminMenus');
    const loginForm = document.getElementById('loginForm');
    const logoutForm = document.getElementById('logoutForm');
    const akunTitle = document.getElementById('akunTitle');
    const akunDesc = document.getElementById('akunDesc');

    if (savedRole === 'superadmin') {
        State.role = 'superadmin';
        if (adminMenus) {
            adminMenus.classList.remove('hidden');
            adminMenus.classList.add('flex');
        }
        document.querySelectorAll('[data-req="superadmin"]').forEach(el => el.classList.remove('hidden'));
        if (loginForm && logoutForm) {
            loginForm.classList.add('hidden');
            logoutForm.classList.remove('hidden');
        }
        if (akunTitle) akunTitle.textContent = "Super Admin Aktif";
        if (akunDesc) akunDesc.textContent = "Akses Penuh: Verifikasi, Master Data, & Pengaturan.";
    } else if (savedRole === 'panitia') {
        State.role = 'panitia';
        if (adminMenus) {
            adminMenus.classList.remove('hidden');
            adminMenus.classList.add('flex');
        }
        document.querySelectorAll('[data-req="superadmin"]').forEach(el => el.classList.add('hidden'));
        if (loginForm && logoutForm) {
            loginForm.classList.add('hidden');
            logoutForm.classList.remove('hidden');
        }
        if (akunTitle) akunTitle.textContent = "Panitia Aktif";
        if (akunDesc) akunDesc.textContent = "Akses Terbatas: Hanya Check-In & Logistik.";
    } else {
        State.role = 'guest';
        if (adminMenus) {
            adminMenus.classList.add('hidden');
            adminMenus.classList.remove('flex');
        }
        if (loginForm && logoutForm) {
            loginForm.classList.remove('hidden');
            logoutForm.classList.add('hidden');
        }
        if (akunTitle) akunTitle.textContent = "Welcome ACR 2026";
        if (akunDesc) akunDesc.textContent = "Silahkan Anda Login";
    }
}

window.syncLegacyToFirestore = async function() {
    const db = window.FirebaseBridge ? window.FirebaseBridge.getDb() : null;
    if (!db) {
        await window.customAlert("Database Firebase belum terhubung atau belum diaktifkan di Firebase Console!<br><br>Pastikan Anda sudah mengklik <strong>'Create database'</strong> di menu Firestore Console.", "warning", "Firestore Belum Siap");
        return;
    }
    
    window.showLoading(true, "Menyiapkan sinkronisasi data...");
    try {
        // 1. Simpan Settings
        await db.collection('settings').doc('event_config').set(State.settings);
        
        // 2. Simpan Peserta dalam Batch (maks 300 per batch)
        const total = State.currentMasterList.length;
        let batch = db.batch();
        let count = 0;
        let batchCount = 0;

        for (let i = 0; i < total; i++) {
            const p = State.currentMasterList[i];
            const ref = db.collection('peserta').doc(p.kode);
            batch.set(ref, p);
            count++;
            batchCount++;

            if (batchCount >= 300 || i === total - 1) {
                window.showLoading(true, `Menyimpan ke Firestore (${count}/${total})...`);
                await batch.commit();
                batch = db.batch();
                batchCount = 0;
            }
        }

        window.showLoading(false);
        await window.customAlert(`<strong>Sinkronisasi Berhasil!</strong><br><br>${total} data peserta dan pengaturan event telah berhasil disimpan permanen ke Firebase Cloud Firestore!`, "success", "Sinkronisasi Sukses");
    } catch(err) {
        window.showLoading(false);
        await window.customAlert("Gagal sinkronisasi ke Firebase:<br><br>" + err.message + "<br><br><em>Pastikan Cloud Firestore telah di-enable (Start in Test Mode) di Firebase Console.</em>", "error");
    }
};

// =====================================================================
// BIB CHECK & PHOTO KIOSK
// =====================================================================
window.handleBibSearchInput = function(query) {
    const resBox = document.getElementById('bibSearchResults');
    if (!resBox) return;
    const q = (query || '').toLowerCase().trim();
    if (q.length < 1) {
        resBox.classList.add('hidden');
        resBox.innerHTML = '';
        return;
    }

    const qDigits = q.replace(/\D/g, '');

    const matches = State.currentMasterList.filter(p => {
        const nama = String(p.nama || '').toLowerCase();
        const bibName = String(p.bibName || '').toLowerCase();
        const bibNumber = String(p.bibNumber || '').toLowerCase();
        const kode = String(p.kode || '').toLowerCase();
        const bibDigits = bibNumber.replace(/\D/g, '');

        return nama.includes(q) ||
               bibName.includes(q) ||
               bibNumber.includes(q) ||
               kode.includes(q) ||
               (qDigits.length > 0 && (bibDigits === qDigits || bibDigits.endsWith(qDigits)));
    }).slice(0, 10);

    if (matches.length === 0) {
        resBox.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">Peserta tidak ditemukan. Periksa kembali ejaan nama, nomor BIB, atau kode pendaftaran.</div>';
        resBox.classList.remove('hidden');
        return;
    }

    const rows = matches.map(p => {
        const isCheckedIn = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true';
        const isVerified = p.status === 'Verified';

        if (!isVerified) {
            return `
                <div onclick="showBibScreen('${p.kode}')" class="p-3 sm:p-4 hover:bg-red-50/60 cursor-pointer transition flex justify-between items-center group">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-700 text-sm uppercase">${escapeHtml(p.nama)}</span>
                            <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200">❌ Belum Lunas / Verified</span>
                        </div>
                        <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>${escapeHtml((p.kategori || '-').replace(/\s*\([^)]*\)/g, '').trim())}</span>
                            <span class="text-slate-300">•</span>
                            <span class="font-mono text-slate-400">Status: ${escapeHtml(p.status)}</span>
                        </div>
                    </div>
                    <span class="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1">
                        <span>🔒 Terkunci</span>
                    </span>
                </div>
            `;
        }

        if (!isCheckedIn) {
            return `
                <div onclick="showBibScreen('${p.kode}')" class="p-3 sm:p-4 hover:bg-amber-50/70 cursor-pointer transition flex justify-between items-center group">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-800 text-sm group-hover:text-amber-700 uppercase">${escapeHtml(p.nama)}</span>
                            <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                                <span>🔒 Belum Check-In</span>
                            </span>
                        </div>
                        <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>${escapeHtml((p.kategori || '-').replace(/\s*\([^)]*\)/g, '').trim())}</span>
                            <span class="text-slate-300">•</span>
                            <span class="font-mono text-amber-700 font-bold">BIB: Terkunci (Ambil di Meja Check-In)</span>
                            <span class="text-slate-300">•</span>
                            <span class="font-mono text-slate-400">${escapeHtml(p.kode)}</span>
                        </div>
                    </div>
                    <button type="button" class="px-3 py-1.5 bg-amber-500 group-hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1">
                        <span>🔒 Terkunci</span>
                    </button>
                </div>
            `;
        }

        return `
            <div onclick="showBibScreen('${p.kode}')" class="p-3 sm:p-4 hover:bg-indigo-50 cursor-pointer transition flex justify-between items-center group">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-800 text-sm group-hover:text-indigo-600 uppercase">${escapeHtml(p.nama)}</span>
                        <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                            <span>✅ Sudah Check-In</span>
                        </span>
                    </div>
                    <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>${escapeHtml((p.kategori || '-').replace(/\s*\([^)]*\)/g, '').trim())}</span>
                        <span class="text-slate-300">•</span>
                        <span class="font-mono text-blue-600 font-bold">BIB: ${escapeHtml(p.bibNumber || 'Sudah Ada')}</span>
                        <span class="text-slate-300">•</span>
                        <span class="font-mono text-slate-400">${escapeHtml(p.kode)}</span>
                    </div>
                </div>
                <button type="button" class="px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1">
                    <span>Pilih</span> 📸
                </button>
            </div>
        `;
    });

    resBox.innerHTML = rows.join('');
    resBox.classList.remove('hidden');
};

window.submitBibSearch = function() {
    const input = document.getElementById('bibSearchInput');
    if (!input) return;
    const q = input.value.toLowerCase().trim();
    if (!q) return;

    const qDigits = q.replace(/\D/g, '');

    const match = State.currentMasterList.find(p => {
        const nama = String(p.nama || '').toLowerCase();
        const bibName = String(p.bibName || '').toLowerCase();
        const bibNumber = String(p.bibNumber || '').toLowerCase();
        const kode = String(p.kode || '').toLowerCase();
        const bibDigits = bibNumber.replace(/\D/g, '');

        return bibNumber === q ||
               kode === q ||
               nama === q ||
               bibName === q ||
               (qDigits.length > 0 && (bibDigits === qDigits || bibDigits.endsWith(qDigits))) ||
               nama.includes(q) ||
               bibName.includes(q) ||
               bibNumber.includes(q) ||
               kode.includes(q);
    });

    if (match) {
        showBibScreen(match.kode);
    } else {
        window.customAlert("Peserta tidak ditemukan! Pastikan nama, nomor BIB, atau kode pendaftaran sudah sesuai.", "warning", "Tidak Ditemukan");
    }
};

window.showBibScreen = function(kode) {
    const p = State.currentMasterList.find(x => x.kode === kode);
    if (!p) return;

    // Sembunyikan dropdown hasil pencarian
    const resBox = document.getElementById('bibSearchResults');
    if (resBox) resBox.classList.add('hidden');

    // Validasi 1: Status Pembayaran / Verifikasi
    if (p.status !== 'Verified') {
        window.customAlert(
            `<div class="text-center py-2">
                <div class="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 class="text-base font-bold text-slate-900 uppercase">${escapeHtml(p.nama)}</h3>
                <p class="text-xs text-red-600 font-bold mt-1">Status: ${escapeHtml(p.status)}</p>
                <p class="text-xs text-slate-600 mt-2">Pendaftaran Anda belum diverifikasi atau belum lunas. Nomor BIB masih terkunci.</p>
            </div>`,
            "error",
            "Pendaftaran Belum Verified"
        );
        return;
    }

    // Validasi 2: Status Check-In (Race Pack Collection)
    const isCheckedIn = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true';
    if (!isCheckedIn) {
        window.customAlert(
            `<div class="space-y-3 py-1">
                <div class="font-black text-slate-900 uppercase text-base sm:text-lg tracking-tight">${escapeHtml(p.nama)}</div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-200">
                    <span>🔒 BIB BELUM DI-CHECK IN</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Layar BIB resmi & Photo Booth <strong>hanya dapat dibuka</strong> untuk peserta yang sudah melakukan <strong>Check-In / Pengambilan Race Pack</strong> di lokasi lomba.
                </p>
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 text-left">
                    <p class="font-bold text-slate-800 mb-1 flex items-center gap-1"><span>📍</span> Petunjuk untuk Pelari:</p>
                    <ol class="list-decimal pl-4 space-y-1 text-slate-500">
                        <li>Kunjungi loket Race Pack Collection panitia di venue.</li>
                        <li>Tunjukkan Kode Pendaftaran: <strong class="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">${escapeHtml(p.kode)}</strong>.</li>
                        <li>Setelah panitia memproses check-in, nomor BIB resmi Anda akan otomatis terbuka!</li>
                    </ol>
                </div>
            </div>`,
            "warning",
            "Layar BIB Masih Terkunci"
        );
        return;
    }

    // Jika sudah check in resmi, tampilkan layar BIB & Photo Booth
    State.currentBibPeserta = p;
    window.currentSelectedBibRunner = p;

    // Bersihkan nominal rupiah, contoh "5K Pelajar (Rp 175.000)" -> "5K PELAJAR"
    let rawKat = String(p.kategori || '5K Pelajar').replace(/\s*\([^)]*\)/g, '').trim();
    let kategoriDisplay = rawKat.toUpperCase();
    let bibDisplay = String(p.bibNumber || p.kode || '-');

    const bibNameSafe = (p.bibName !== undefined && p.bibName !== null) ? String(p.bibName).trim() : '';
    const namaSafe = (p.nama !== undefined && p.nama !== null) ? String(p.nama).trim() : '';
    const displayBibName = (bibNameSafe ? bibNameSafe : namaSafe).toUpperCase();

    document.getElementById('dispBibKategori').textContent = kategoriDisplay;
    document.getElementById('dispBibNumber').textContent = bibDisplay;
    document.getElementById('dispBibName').textContent = displayBibName;
    document.getElementById('dispNamaLengkap').textContent = namaSafe.toUpperCase();
    document.getElementById('dispBibJersey').textContent = String(p.jersey || '-');
    document.getElementById('dispBibKode').textContent = String(p.kode || '');

    const statusBadge = document.getElementById('dispBibStatusBadge');
    if (statusBadge) {
        statusBadge.className = "px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-1";
        statusBadge.innerHTML = "<span>✅ Verified & Checked-In</span>";
    }

    const qrEl = document.getElementById('dispBibQrCode');
    if (qrEl) {
        qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(p.bibNumber || p.kode)}`;
    }

    const wrapper = document.getElementById('bibDisplayWrapper');
    if (wrapper) wrapper.classList.remove('hidden');

    const searchContainer = document.getElementById('bibSearchContainer');
    if (searchContainer) searchContainer.classList.add('hidden');

    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.resetBibSearch = function() {
    State.currentBibPeserta = null;
    window.currentSelectedBibRunner = null;
    const searchContainer = document.getElementById('bibSearchContainer');
    if (searchContainer) searchContainer.classList.remove('hidden');

    const wrapper = document.getElementById('bibDisplayWrapper');
    if (wrapper) wrapper.classList.add('hidden');

    const input = document.getElementById('bibSearchInput');
    if (input) {
        input.value = '';
        input.focus();
    }
};

window.toggleBibFullscreen = function() {
    const elem = document.getElementById('bibPhotoBackdrop');
    if (!elem) return;

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        const btnText = document.getElementById('fullscreenBtnText');
        if (btnText) btnText.textContent = "Keluar Fullscreen";
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        const btnText = document.getElementById('fullscreenBtnText');
        if (btnText) btnText.textContent = "Layar Penuh (TV Kiosk)";
    }
};

window.downloadBibPoster = async function() {
    const elem = document.getElementById('bibPhotoBackdrop');
    if (!elem) return;

    window.showLoading(true, "Membuat Gambar Foto BIB...");
    try {
        if (typeof html2canvas === 'undefined') {
            throw new Error("Library pembuat gambar sedang dimuat, silakan coba 2 detik lagi.");
        }
        const canvas = await html2canvas(elem, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        const link = document.createElement('a');
        const bibNum = (document.getElementById('dispBibNumber').textContent || 'BIB').trim();
        link.download = `BIB_CHECK_${bibNum}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        window.showLoading(false);
    } catch(err) {
        window.showLoading(false);
        window.customAlert("Gagal mengunduh gambar poster: " + err.message, "error");
    }
};

// =====================================================================
// FITUR CETAK & DOWNLOAD LEMBAR NOMOR BIB RESMI + QR CODE (A5 LANDSCAPE)
// =====================================================================

function getCurrentSelectedBibRunner() {
    let p = window.currentSelectedBibRunner || State.currentBibPeserta;
    if (!p) {
        const kodeEl = document.getElementById('dispBibKode');
        if (kodeEl && kodeEl.textContent) {
            p = State.currentMasterList.find(x => x.kode === kodeEl.textContent.trim());
        }
    }
    if (!p) {
        const bibEl = document.getElementById('dispBibNumber');
        if (bibEl && bibEl.textContent) {
            const b = bibEl.textContent.trim();
            p = State.currentMasterList.find(x => x.bibNumber === b);
        }
    }
    if (p) {
        const isCheckedIn = p.checkedIn === true || p.checkedIn === 'TRUE' || p.checkedIn === 'true';
        if (!isCheckedIn || p.status !== 'Verified') return null;
    }
    return p;
}

// Helper untuk generate QR Code element offline menggunakan QRCode.js
async function getBibQrCodeElement(qrText, targetSize = 340) {
    qrText = String(qrText || 'ACR-2026').trim();
    if (!qrText) qrText = 'ACR-2026';

    return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.visibility = 'hidden';
        document.body.appendChild(tempDiv);

        try {
            new QRCode(tempDiv, {
                text: qrText,
                width: targetSize,
                height: targetSize,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // Cari elemen canvas hasil render
            const cvs = tempDiv.querySelector('canvas');
            if (cvs && cvs.width > 0) {
                resolve({ element: cvs, cleanup: () => { if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv); } });
                return;
            }

            const img = tempDiv.querySelector('img');
            if (img) {
                if (img.complete && img.naturalWidth > 0) {
                    resolve({ element: img, cleanup: () => { if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv); } });
                } else {
                    img.onload = () => resolve({ element: img, cleanup: () => { if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv); } });
                    img.onerror = () => resolve({ element: cvs || img, cleanup: () => { if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv); } });
                }
            } else {
                resolve({ element: null, cleanup: () => { if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv); } });
            }
        } catch (e) {
            console.error("QR Code generation error:", e);
            resolve({ element: null, cleanup: () => { if (tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv); } });
        }
    });
}

// Render kanvas lembar BIB A5 Landscape resolusi tinggi (1754 x 1240 px)
window.createBibCanvas = async function(p, customScale = 1.0) {
    const W = Math.round(1754 * customScale);
    const H = Math.round(1240 * customScale);
    const scale = customScale;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Background putih bersih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Skema Warna Kategori
    const katStr = (p.kategori || '').toLowerCase();
    let katTitle = '5K UMUM';
    let themeDark = '#064e3b';
    let themeColor = '#047857'; // Emerald
    let themeLight = '#ecfdf5';
    let themeBorder = '#a7f3d0';

    if (katStr.includes('pelajar')) {
        katTitle = '5K PELAJAR';
        themeDark = '#1e3a8a';
        themeColor = '#1d4ed8'; // Blue
        themeLight = '#eff6ff';
        themeBorder = '#bfdbfe';
    } else if (katStr.includes('kid')) {
        katTitle = '2,5K KIDS';
        themeDark = '#92400e';
        themeColor = '#d97706'; // Amber / Orange
        themeLight = '#fffbeb';
        themeBorder = '#fde68a';
    } else if (katStr.includes('fun')) {
        katTitle = '5K FUN RUN';
        themeDark = '#5b21b6';
        themeColor = '#7c3aed'; // Purple
        themeLight = '#f5f3ff';
        themeBorder = '#ddd6fe';
    } else if (p.kategori) {
        katTitle = String(p.kategori).replace(/\s*\([^)]*\)/g, '').trim().toUpperCase();
    }

    // Garis bingkai luar halus
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(30 * scale, 30 * scale, W - 60 * scale, H - 60 * scale);

    // 2. Tanda 4 Lubang Peniti (Crosshair Pin-Hole Guides)
    const pinHoles = [
        { x: 90 * scale, y: 80 * scale },
        { x: W - 90 * scale, y: 80 * scale },
        { x: 90 * scale, y: H - 80 * scale },
        { x: W - 90 * scale, y: H - 80 * scale }
    ];

    pinHoles.forEach(pt => {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5 * scale;
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 14 * scale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(pt.x - 20 * scale, pt.y);
        ctx.lineTo(pt.x + 20 * scale, pt.y);
        ctx.moveTo(pt.x, pt.y - 20 * scale);
        ctx.lineTo(pt.x, pt.y + 20 * scale);
        ctx.stroke();
        ctx.restore();
    });

    // 3. Header Banner (Pita Kategori Atas)
    const headerTop = 45 * scale;
    const headerH = 175 * scale;
    const headerLeft = 60 * scale;
    const headerW = W - 120 * scale;

    // Background Header Gradasi
    const grad = ctx.createLinearGradient(headerLeft, headerTop, headerLeft + headerW, headerTop);
    grad.addColorStop(0, themeDark);
    grad.addColorStop(1, themeColor);
    ctx.fillStyle = grad;
    
    // Rounded header top banner
    roundRect(ctx, headerLeft, headerTop, headerW, headerH, 20 * scale);
    ctx.fill();

    // Gambar Logo ACR jika ada di halaman
    const logoImg = document.querySelector('img[src="images/logo.png"]');
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, headerLeft + 25 * scale, headerTop + 20 * scale, 135 * scale, 135 * scale);
    }

    // Teks Event Header
    const textX = (logoImg && logoImg.complete && logoImg.naturalWidth > 0) ? headerLeft + 180 * scale : headerLeft + 40 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${46 * scale}px "Montserrat", "Arial Black", sans-serif`;
    ctx.fillText("ALPHA CHASE RUN 2026", textX, headerTop + 75 * scale);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = `700 ${22 * scale}px sans-serif`;
    ctx.fillText("OFFICIAL RACE BIB  •  27 SEPTEMBER 2026  •  BONTANG LESTARI", textX, headerTop + 125 * scale);

    // Badge Kategori (Kanan Atas)
    const badgeW = 420 * scale;
    const badgeH = 76 * scale;
    const badgeX = headerLeft + headerW - badgeW - 25 * scale;
    const badgeY = headerTop + (headerH - badgeH) / 2;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 38 * scale);
    ctx.fill();

    ctx.fillStyle = themeColor;
    ctx.font = `900 ${36 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(katTitle, badgeX + badgeW / 2, badgeY + 52 * scale);
    ctx.textAlign = 'left'; // reset

    // 4. Area Konten Utama (BIB Number + Nama + Detail)
    const contentLeft = 90 * scale;

    // Label Official BIB
    ctx.fillStyle = '#64748b';
    ctx.font = `800 ${22 * scale}px sans-serif`;
    ctx.fillText("NOMOR DADA RESMI (OFFICIAL BIB NUMBER)", contentLeft, 275 * scale);

    // NOMOR BIB RAKSASA (Hero of the BIB)
    const bibStr = String(p.bibNumber || p.kode || '1000').trim();
    ctx.fillStyle = '#0f172a';
    ctx.font = `900 ${220 * scale}px "Courier New", monospace, sans-serif`;
    ctx.fillText(bibStr, contentLeft - 8 * scale, 480 * scale);

    // Box Nama Pelari (BIB Name / Full Name)
    const rawBibName = (p.bibName !== undefined && p.bibName !== null) ? String(p.bibName).trim() : '';
    const rawNama = (p.nama !== undefined && p.nama !== null) ? String(p.nama).trim() : '';
    const runnerBibName = (rawBibName ? rawBibName : rawNama).toUpperCase();
    ctx.fillStyle = themeDark;
    ctx.font = `900 ${60 * scale}px sans-serif`;
    ctx.fillText(runnerBibName, contentLeft, 575 * scale);

    // Nama Lengkap & Kode Registrasi
    ctx.fillStyle = '#475569';
    ctx.font = `700 ${28 * scale}px sans-serif`;
    const subNameStr = (rawNama ? rawNama.toUpperCase() : '') + (p.kode ? `  •  ID: ${String(p.kode).trim()}` : '');
    ctx.fillText(subNameStr, contentLeft, 625 * scale);

    // 5. Box QR Code Resmi (Kanan Tengah)
    const qrBoxW = 410 * scale;
    const qrBoxH = 550 * scale;
    const qrBoxX = W - qrBoxW - 85 * scale;
    const qrBoxY = 245 * scale;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3 * scale;
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 24 * scale);
    ctx.fill();
    ctx.stroke();

    // Generate QR Code Element (Encodes bibNumber or kode)
    const qrCodeText = String(p.bibNumber || p.kode || '').trim();
    const qrTargetSize = Math.round(330 * scale);
    const qrResult = await getBibQrCodeElement(qrCodeText, qrTargetSize);

    if (qrResult && qrResult.element) {
        const qrDrawX = qrBoxX + (qrBoxW - qrTargetSize) / 2;
        const qrDrawY = qrBoxY + 30 * scale;
        ctx.drawImage(qrResult.element, qrDrawX, qrDrawY, qrTargetSize, qrTargetSize);
        qrResult.cleanup();
    } else {
        // Fallback jika QR offline gagal
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(qrBoxX + 40 * scale, qrBoxY + 40 * scale, 330 * scale, 330 * scale);
        ctx.fillStyle = '#475569';
        ctx.font = `700 ${20 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText("QR CODE RESMI", qrBoxX + qrBoxW / 2, qrBoxY + 200 * scale);
        ctx.textAlign = 'left';
    }

    // Label di Bawah QR Code
    ctx.textAlign = 'center';
    ctx.fillStyle = themeColor;
    ctx.font = `900 ${25 * scale}px sans-serif`;
    ctx.fillText("SCAN START & FINISH", qrBoxX + qrBoxW / 2, qrBoxY + 415 * scale);

    ctx.fillStyle = '#64748b';
    ctx.font = `700 ${17 * scale}px sans-serif`;
    ctx.fillText("VALIDASI GATE RESMI ACR 2026", qrBoxX + qrBoxW / 2, qrBoxY + 448 * scale);

    ctx.fillStyle = '#0f172a';
    ctx.font = `800 ${22 * scale}px monospace`;
    ctx.fillText(qrCodeText, qrBoxX + qrBoxW / 2, qrBoxY + 488 * scale);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 ${14 * scale}px sans-serif`;
    ctx.fillText("TIDAK BOLEH DILIPAT / DITUTUP", qrBoxX + qrBoxW / 2, qrBoxY + 520 * scale);
    ctx.textAlign = 'left'; // reset

    // 6. Metadata Pelari Cards (Gender, Jersey, Komunitas/Kota, Status)
    const cardY = 675 * scale;
    const cardH = 95 * scale;
    const cardSpacing = 16 * scale;
    const cardAreaW = qrBoxX - contentLeft - 30 * scale;
    const singleCardW = (cardAreaW - (cardSpacing * 2)) / 3;

    const rawGender = String(p.gender || '').toUpperCase();
    const genderVal = (rawGender === 'L' || rawGender.includes('LAKI') ? 'LAKI-LAKI' : (rawGender === 'P' || rawGender.includes('PEREMPUAN') ? 'PEREMPUAN' : (rawGender || '-')));
    const rawKomunitas = (p.komunitas !== undefined && p.komunitas !== null) ? String(p.komunitas).trim() : '';
    const rawKota = (p.kota !== undefined && p.kota !== null) ? String(p.kota).trim() : 'BONTANG';
    const cityVal = (rawKomunitas ? rawKomunitas : rawKota).toUpperCase();

    const metadataCards = [
        {
            title: "GENDER",
            val: genderVal,
            icon: "👤"
        },
        {
            title: "JERSEY OFFICIAL",
            val: String(p.jersey || '-').toUpperCase(),
            icon: "🎽"
        },
        {
            title: "KOMUNITAS / KOTA",
            val: cityVal,
            icon: "📍"
        }
    ];

    metadataCards.forEach((c, idx) => {
        const cx = contentLeft + idx * (singleCardW + cardSpacing);
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2 * scale;
        roundRect(ctx, cx, cardY, singleCardW, cardH, 16 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = `800 ${16 * scale}px sans-serif`;
        ctx.fillText(c.title, cx + 18 * scale, cardY + 32 * scale);

        ctx.fillStyle = '#0f172a';
        ctx.font = `900 ${22 * scale}px sans-serif`;
        // Truncate jika terlalu panjang
        let valText = c.val;
        if (valText.length > 18) valText = valText.substring(0, 16) + '...';
        ctx.fillText(valText, cx + 18 * scale, cardY + 68 * scale);
    });

    // Box Peringatan & Aturan Singkat Penggunaan BIB
    const ruleBoxY = 795 * scale;
    const ruleBoxH = 90 * scale;
    ctx.fillStyle = themeLight;
    ctx.strokeStyle = themeBorder;
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, contentLeft, ruleBoxY, cardAreaW, ruleBoxH, 16 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = themeDark;
    ctx.font = `800 ${18 * scale}px sans-serif`;
    ctx.fillText("PETUNJUK PENTING BAGI PESERTA:", contentLeft + 20 * scale, ruleBoxY + 34 * scale);

    ctx.fillStyle = '#334155';
    ctx.font = `600 ${16 * scale}px sans-serif`;
    ctx.fillText("1. Pasang nomor BIB di bagian dada depan jersey menggunakan 4 peniti yang disediakan.", contentLeft + 20 * scale, ruleBoxY + 60 * scale);
    ctx.fillText("2. Pastikan QR Code bersih & tidak terlipat untuk proses scanning di Gerbang Start & Finish.", contentLeft + 20 * scale, ruleBoxY + 80 * scale);

    // 7. Footer Banner (Tagline & Hak Cipta Event)
    const footerTop = H - 110 * scale;
    const footerH = 65 * scale;
    ctx.fillStyle = themeColor;
    roundRect(ctx, headerLeft, footerTop, headerW, footerH, 14 * scale);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${22 * scale}px "Montserrat", sans-serif`;
    ctx.fillText("★  STRENGTH  •  HONOR  •  BROTHERHOOD  ★  ALPHA CHASE RUN 2026 OFFICIAL  ★", W / 2, footerTop + 40 * scale);
    ctx.textAlign = 'left'; // reset

    return canvas;
};

// Helper canvas roundRect
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
}

// Download lembar BIB perorangan dalam format PDF Siap Cetak (A5 Landscape)
window.downloadSingleBibPdf = async function() {
    const p = getCurrentSelectedBibRunner();
    if (!p) {
        window.customAlert("Silakan pilih atau cari peserta terlebih dahulu sebelum mencetak BIB.", "warning", "Peserta Belum Dipilih");
        return;
    }

    window.showLoading(true, `Menyiapkan PDF BIB ${p.bibNumber || p.kode}...`);
    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error("Library PDF sedang dimuat, mohon tunggu 2 detik.");
        }

        const canvas = await window.createBibCanvas(p, 1.0);
        const { jsPDF } = window.jspdf;
        // A5 Landscape: 210 x 148 mm
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a5',
            compress: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 148, undefined, 'FAST');

        const cleanBib = String(p.bibNumber || p.kode || 'BIB').replace(/[^a-zA-Z0-9_-]/g, '');
        const cleanName = String(p.nama || 'Peserta').trim().replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`BIB_ACR2026_${cleanBib}_${cleanName}.pdf`);

        window.showLoading(false);
        window.customAlert(`Lembar BIB resmi ${cleanBib} siap cetak (PDF A5) berhasil diunduh! Berikan file ini ke vendor percetakan atau cetak langsung.`, "success", "Download PDF Berhasil");
    } catch (err) {
        window.showLoading(false);
        window.customAlert("Gagal membuat PDF BIB: " + err.message, "error");
    }
};

// Download lembar BIB perorangan dalam format Gambar HD (PNG)
window.downloadSingleBibImage = async function() {
    const p = getCurrentSelectedBibRunner();
    if (!p) {
        window.customAlert("Silakan pilih atau cari peserta terlebih dahulu sebelum mendownload BIB.", "warning", "Peserta Belum Dipilih");
        return;
    }

    window.showLoading(true, `Membuat Gambar HD BIB ${p.bibNumber || p.kode}...`);
    try {
        const canvas = await window.createBibCanvas(p, 1.0);
        const link = document.createElement('a');
        const cleanBib = String(p.bibNumber || p.kode || 'BIB').replace(/[^a-zA-Z0-9_-]/g, '');
        const cleanName = String(p.nama || 'Peserta').trim().replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `BIB_ACR2026_${cleanBib}_${cleanName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        window.showLoading(false);
        window.customAlert(`Gambar HD BIB resmi ${cleanBib} (PNG) berhasil diunduh!`, "success", "Download PNG Berhasil");
    } catch (err) {
        window.showLoading(false);
        window.customAlert("Gagal mendownload gambar BIB: " + err.message, "error");
    }
};

// =====================================================================
// KONTROL MODAL & FITUR CETAK BATCH / MASSAL BIB (MULTI-PAGE PDF A5)
// =====================================================================

window.openBatchBibModal = function() {
    const modal = document.getElementById('batchBibModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    window.updateBatchBibCount();

    // Reset progress container
    const pContainer = document.getElementById('batchBibProgressContainer');
    if (pContainer) pContainer.classList.add('hidden');
    const pBar = document.getElementById('batchBibProgressBar');
    if (pBar) pBar.style.width = '0%';
    const btn = document.getElementById('btnStartBatchPdf');
    if (btn) btn.disabled = false;
};

window.closeBatchBibModal = function() {
    const modal = document.getElementById('batchBibModal');
    if (modal) modal.classList.add('hidden');
};

function getFilteredBatchBibRunners() {
    const catVal = (document.getElementById('batchBibCategory')?.value || 'ALL').toUpperCase();
    const statusVal = (document.getElementById('batchBibStatus')?.value || 'Verified');

    let list = State.currentMasterList || [];

    // Filter Kategori
    if (catVal !== 'ALL') {
        list = list.filter(p => {
            const k = (p.kategori || '').toLowerCase();
            if (catVal === 'PELAJAR') return k.includes('pelajar');
            if (catVal === 'UMUM') return k.includes('umum');
            if (catVal === 'KIDS') return k.includes('kid');
            if (catVal === 'FUN') return k.includes('fun');
            return true;
        });
    }

    // Filter Status
    if (statusVal === 'Verified') {
        list = list.filter(p => p.status === 'Verified');
    }

    // Urutkan berdasarkan nomor BIB numerik agar rapi saat dicetak
    list.sort((a, b) => {
        const numA = parseInt(String(a.bibNumber || '').replace(/\D/g, '')) || 0;
        const numB = parseInt(String(b.bibNumber || '').replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    return list;
}

window.updateBatchBibCount = function() {
    const runners = getFilteredBatchBibRunners();
    const countEl = document.getElementById('batchBibTargetCount');
    if (countEl) {
        countEl.textContent = `${runners.length} Lembar BIB`;
    }
};

window.generateBatchBibPdf = async function() {
    const runners = getFilteredBatchBibRunners();
    if (!runners || runners.length === 0) {
        window.customAlert("Tidak ada data peserta yang cocok dengan filter yang dipilih.", "warning");
        return;
    }

    const catVal = document.getElementById('batchBibCategory')?.value || 'ALL';
    const statusVal = document.getElementById('batchBibStatus')?.value || 'Verified';

    const pContainer = document.getElementById('batchBibProgressContainer');
    const pBar = document.getElementById('batchBibProgressBar');
    const pText = document.getElementById('batchBibProgressText');
    const pPercent = document.getElementById('batchBibProgressPercent');
    const btn = document.getElementById('btnStartBatchPdf');

    if (pContainer) pContainer.classList.remove('hidden');
    if (btn) btn.disabled = true;

    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error("Library PDF belum siap, silakan coba 2 detik lagi.");
        }

        const { jsPDF } = window.jspdf;
        // Gunakan jsPDF format A5 landscape (210 x 148 mm)
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a5',
            compress: true
        });

        // Untuk batch ekspor, kita gunakan scale 0.8 (1403 x 992 px) agar render super cepat & file PDF ringan tanpa mengurangi ketajaman cetak A5
        const batchScale = 0.8;
        const total = runners.length;

        let pagesAdded = 0;
        for (let i = 0; i < total; i++) {
            const p = runners[i];
            const currentNum = i + 1;
            const pct = Math.round((currentNum / total) * 100);

            if (pBar) pBar.style.width = `${pct}%`;
            if (pPercent) pPercent.textContent = `${pct}%`;
            if (pText) pText.textContent = `Membuat BIB ${String(p.bibNumber || p.kode || '-')} (${currentNum}/${total})...`;

            try {
                // Buat kanvas BIB
                const cvs = await window.createBibCanvas(p, batchScale);
                const imgData = cvs.toDataURL('image/jpeg', 0.85);

                if (pagesAdded > 0) {
                    doc.addPage('a5', 'landscape');
                }
                doc.addImage(imgData, 'JPEG', 0, 0, 210, 148, undefined, 'FAST');
                pagesAdded++;
            } catch (errOne) {
                console.warn(`Peringatan: Gagal merender BIB peserta ${p.kode || p.bibNumber}:`, errOne);
            }

            // Beri nafas event loop browser setiap 3 lembar agar antarmuka tidak freeze
            if (i % 3 === 0 || i === total - 1) {
                await new Promise(r => setTimeout(r, 10));
            }
        }

        if (pText) pText.textContent = "Mengompresi dan mendownload dokumen PDF...";
        await new Promise(r => setTimeout(r, 50));

        const nowStr = new Date().toISOString().slice(0, 10);
        const fileName = `ACR2026_BATCH_BIB_${catVal}_${statusVal}_${total}Runners_${nowStr}.pdf`;
        doc.save(fileName);

        if (pText) pText.textContent = "Selesai! PDF berhasil diunduh.";
        if (btn) btn.disabled = false;

        setTimeout(() => {
            window.closeBatchBibModal();
            window.customAlert(`Batch PDF (${total} lembar nomor BIB A5) berhasil dibuat & diunduh! Dokumen siap langsung dicetak atau diserahkan ke vendor percetakan.`, "success", "Batch Cetak Berhasil");
        }, 800);

    } catch (err) {
        console.error("Batch PDF Error:", err);
        if (btn) btn.disabled = false;
        if (pText) pText.textContent = "Terjadi kesalahan.";
        window.customAlert("Gagal membuat batch PDF: " + err.message, "error");
    }
};

// =====================================================================
// INISIALISASI APLIKASI
// =====================================================================
async function initialLoad() {
    startOnlineCounter();
    checkFirebaseBanner();
    loadSeedDataIfEmpty();
    restoreAdminRole();
    applySettingsToUI();
    
    window.showLoading(true, "Memuat Data...");
    
    // Inisialisasi Firebase & Listener Real-Time
    if (window.FirebaseBridge && window.FirebaseBridge.isConfigured()) {
        window.FirebaseBridge.init();
        setupFirestoreListeners();
    } else {
        loadLocalFallbackData();
    }

    // Buka Halaman Publik (Info) secara default saat website diakses
    const defaultPage = State.role === 'superadmin' ? 'dashboard' : (State.role === 'panitia' ? 'checkin' : 'info');
    window.nav(defaultPage);
    window.showLoading(false);
}

// Jalankan inisialisasi saat window dimuat
window.addEventListener('DOMContentLoaded', initialLoad);

// =====================================================================
// MODUL: START GATE QR SCANNER & LIVE START MONITOR
// =====================================================================

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let currentStartGate = 'Gate 1';
let html5QrScanner = null;
let isScannerRunning = false;
let currentFacingMode = "environment";
let recentGateScans = [];
let audioCtx = null;
let startLiveCategoryFilter = 'ALL';
let liveClockInterval = null;

// Audio Feedback Web Audio API
function playBeep(isSuccess) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (isSuccess) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.15);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.3);
        }

        if ('vibrate' in navigator) {
            navigator.vibrate(isSuccess ? [80] : [150, 80, 150]);
        }
    } catch (e) {
        console.warn("Audio Context tidak diizinkan atau belum aktif:", e);
    }
}

window.changeStartGate = function(gateVal) {
    currentStartGate = gateVal || 'Gate 1';
    const lbl = document.getElementById('lblCurrentGate');
    if (lbl) lbl.textContent = currentStartGate;
    renderGateRecentList();
};

window.initStartGatePage = function() {
    updateStartGateCounters();
    renderGateRecentList();
    window.startStartGateScanner();
};

window.startStartGateScanner = async function() {
    const readerEl = document.getElementById('startQrReader');
    if (!readerEl) return;
    if (typeof Html5Qrcode === 'undefined') {
        console.warn("Library Html5Qrcode belum termuat!");
        return;
    }

    if (isScannerRunning && html5QrScanner) {
        return;
    }

    try {
        if (!html5QrScanner) {
            html5QrScanner = new Html5Qrcode("startQrReader");
        }

        const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        await html5QrScanner.start(
            { facingMode: currentFacingMode },
            config,
            (decodedText) => {
                window.handleStartScan(decodedText);
            },
            () => {}
        );

        isScannerRunning = true;
        const btnTxt = document.getElementById('txtToggleScanner');
        if (btnTxt) btnTxt.textContent = "Hentikan Kamera";
    } catch (err) {
        console.warn("Gagal membuka kamera:", err);
        isScannerRunning = false;
        const btnTxt = document.getElementById('txtToggleScanner');
        if (btnTxt) btnTxt.textContent = "Mulai Kamera";
        
        const box = document.getElementById('startScanResultBox');
        if (box) {
            box.className = "p-6 rounded-2xl border-2 border-amber-300 bg-amber-50 text-center min-h-[220px] flex flex-col justify-center items-center transition-all duration-300";
            box.innerHTML = `
                <span class="text-4xl mb-2">📷</span>
                <h3 class="font-bold text-amber-900 text-base">Kamera Tidak Tersedia</h3>
                <p class="text-xs text-amber-700 mt-1 max-w-xs">Izin kamera belum diberikan atau perangkat tidak memiliki kamera aktif. Anda tetap dapat menggunakan <strong>Input Manual</strong> di bawah!</p>
            `;
        }
    }
};

window.stopStartGateScanner = async function() {
    if (html5QrScanner && isScannerRunning) {
        try {
            await html5QrScanner.stop();
        } catch (e) {
            console.warn("Error stopping scanner:", e);
        }
        isScannerRunning = false;
        const btnTxt = document.getElementById('txtToggleScanner');
        if (btnTxt) btnTxt.textContent = "Mulai Kamera";
    }
};

window.toggleStartScanner = function() {
    if (isScannerRunning) {
        window.stopStartGateScanner();
    } else {
        window.startStartGateScanner();
    }
};

window.switchStartCamera = async function() {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    if (isScannerRunning) {
        await window.stopStartGateScanner();
        await window.startStartGateScanner();
    }
};

let lastScannedCode = '';
let lastScannedTime = 0;

window.handleStartScan = async function(rawCode) {
    if (!rawCode) return;
    const now = Date.now();
    const cleanCode = String(rawCode).trim().toUpperCase();

    if (cleanCode === lastScannedCode && (now - lastScannedTime) < 2500) {
        return;
    }

    lastScannedCode = cleanCode;
    lastScannedTime = now;

    await window.processStartScan(cleanCode);
};

window.submitManualStart = async function(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('manualStartInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    await window.processStartScan(val);
    input.value = '';
    input.focus();
};

window.processStartScan = async function(inputVal) {
    const box = document.getElementById('startScanResultBox');
    const q = String(inputVal).trim().toUpperCase();
    const qDigits = q.replace(/\D/g, '');

    let p = State.currentMasterList.find(x => {
        const b = String(x.bibNumber || '').toUpperCase();
        const k = String(x.kode || '').toUpperCase();
        const bDigits = b.replace(/\D/g, '');

        return b === q ||
               k === q ||
               (qDigits.length >= 3 && (bDigits === qDigits || bDigits.endsWith(qDigits)));
    });

    if (!p) {
        playBeep(false);
        if (box) {
            box.className = "p-6 rounded-2xl border-2 border-red-400 bg-red-50 text-center min-h-[220px] flex flex-col justify-center items-center transition-all duration-300";
            box.innerHTML = `
                <span class="text-4xl mb-2">❌</span>
                <h3 class="font-black text-red-700 text-lg">PESERTA TIDAK DITEMUKAN!</h3>
                <p class="text-xs text-red-600 mt-1">Kode / BIB "<strong>${escapeHtml(inputVal)}</strong>" tidak ada di sistem.</p>
            `;
        }
        return;
    }

    if (p.status !== 'Verified') {
        playBeep(false);
        if (box) {
            box.className = "p-6 rounded-2xl border-2 border-yellow-400 bg-yellow-50 text-center min-h-[220px] flex flex-col justify-center items-center transition-all duration-300";
            box.innerHTML = `
                <span class="text-4xl mb-2">⚠️</span>
                <h3 class="font-black text-yellow-800 text-lg">BELUM DIVERIFIKASI!</h3>
                <p class="text-xs text-yellow-700 mt-1">Peserta <strong>${escapeHtml(p.nama)}</strong> (${escapeHtml(p.bibNumber || p.kode)}) berstatus <em>${escapeHtml(p.status)}</em>.</p>
            `;
        }
        return;
    }

    if (p.started === true || p.started === 'true' || p.started === 'TRUE') {
        playBeep(false);
        const timeStr = p.startedAt ? (typeof p.startedAt === 'number' ? new Date(p.startedAt).toLocaleTimeString('id-ID') : String(p.startedAt)) : '-';
        if (box) {
            box.className = "p-6 rounded-2xl border-2 border-amber-400 bg-amber-50 text-center min-h-[220px] flex flex-col justify-center items-center transition-all duration-300";
            box.innerHTML = `
                <span class="text-4xl mb-2">⛔</span>
                <h3 class="font-black text-amber-900 text-lg">SUDAH MELAKUKAN START!</h3>
                <p class="text-xs sm:text-sm text-amber-800 mt-1">
                    <strong>${escapeHtml(p.nama)}</strong> (${escapeHtml(p.bibNumber || p.kode)})<br>
                    Telah melintasi <strong>${escapeHtml(p.startGate || 'Gate')}</strong> pada pukul <strong class="text-amber-950 font-mono text-base">${escapeHtml(timeStr)}</strong>
                </p>
                <span class="mt-3 px-3 py-1 bg-amber-200/80 text-amber-900 text-[11px] font-bold rounded-full">Anti-Duplicate Protection</span>
            `;
        }
        return;
    }

    // Sukses Start!
    const scanTimestamp = Date.now();
    const scanDate = new Date(scanTimestamp);
    const timeFormatted = `${String(scanDate.getHours()).padStart(2, '0')}:${String(scanDate.getMinutes()).padStart(2, '0')}:${String(scanDate.getSeconds()).padStart(2, '0')}`;
    const gateUsed = currentStartGate;

    p.started = true;
    p.startedAt = scanTimestamp;
    p.startGate = gateUsed;

    playBeep(true);

    if (box) {
        box.className = "p-6 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-center min-h-[220px] flex flex-col justify-center items-center transition-all duration-300 shadow-md";
        box.innerHTML = `
            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black mb-2 shadow">
                <span>✓ BERHASIL START</span> • <span>${escapeHtml(gateUsed)}</span>
            </div>
            <div class="font-mono text-3xl sm:text-4xl font-black text-emerald-800 tracking-tight my-1">
                ${escapeHtml(p.bibNumber || p.kode)}
            </div>
            <h3 class="font-black text-slate-900 text-lg sm:text-xl uppercase leading-snug">
                ${escapeHtml(p.nama)}
            </h3>
            <p class="text-xs text-slate-600 font-bold mt-1">
                ${escapeHtml((p.kategori || '').replace(/\s*\([^)]*\)/g, '').trim())} • <span class="font-mono text-emerald-700">${escapeHtml(timeFormatted)} WIB</span>
            </p>
        `;
    }

    recentGateScans.unshift({
        kode: p.kode,
        bibNumber: p.bibNumber,
        nama: p.nama,
        kategori: p.kategori,
        gate: gateUsed,
        time: timeFormatted
    });
    if (recentGateScans.length > 30) recentGateScans.pop();
    renderGateRecentList();
    updateStartGateCounters();

    try {
        await updatePeserta(p.kode, {
            started: true,
            startedAt: scanTimestamp,
            startGate: gateUsed
        });
    } catch (err) {
        console.error("Gagal update status start ke Firestore:", err);
    }
};

function renderGateRecentList() {
    const listEl = document.getElementById('gateRecentList');
    if (!listEl) return;

    if (recentGateScans.length === 0) {
        listEl.innerHTML = '<div class="text-center py-4 text-xs text-slate-400">Belum ada peserta di-scan pada sesi ini.</div>';
        return;
    }

    const rows = recentGateScans.map(item => `
        <div class="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-2">
                <span class="font-mono font-black text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">${escapeHtml(item.bibNumber || '-')}</span>
                <div>
                    <span class="font-bold text-slate-800 text-xs block leading-tight truncate max-w-[140px] sm:max-w-[180px]">${escapeHtml(item.nama)}</span>
                    <span class="text-[10px] text-slate-400">${escapeHtml((item.kategori || '').replace(/\s*\([^)]*\)/g, '').trim())}</span>
                </div>
            </div>
            <div class="text-right">
                <span class="font-mono text-[11px] font-bold text-emerald-600 block">${escapeHtml(item.time)}</span>
                <span class="text-[9px] font-bold text-slate-400">${escapeHtml(item.gate)}</span>
            </div>
        </div>
    `);

    listEl.innerHTML = rows.join('');
    const timeEl = document.getElementById('gateScanTime');
    if (timeEl && recentGateScans.length > 0) {
        timeEl.textContent = recentGateScans[0].time;
    }
}

function updateStartGateCounters() {
    const totalPeserta = State.currentMasterList.length;
    const totalStarted = State.currentMasterList.filter(p => p.started === true || p.started === 'true').length;

    const thisGateCountEl = document.getElementById('thisGateCount');
    const totalStartedEl = document.getElementById('totalStartedCount');

    if (thisGateCountEl) thisGateCountEl.textContent = recentGateScans.length;
    if (totalStartedEl) totalStartedEl.textContent = `${totalStarted} / ${totalPeserta}`;
}

// =====================================================================
// MODUL: START LIVE MONITOR
// =====================================================================

window.initStartLivePage = function() {
    if (!liveClockInterval) {
        liveClockInterval = setInterval(updateLiveClock, 1000);
        updateLiveClock();
    }
    updateStartLiveCounters();
    renderStartLiveFeed();
};

function updateLiveClock() {
    const clockEl = document.getElementById('liveClockDisplay');
    if (!clockEl) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;
}

window.filterStartLive = function(catKey, btnEl) {
    startLiveCategoryFilter = catKey || 'ALL';
    document.querySelectorAll('.start-live-cat-btn').forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white');
        b.classList.add('bg-slate-100', 'text-slate-700');
    });
    if (btnEl) {
        btnEl.classList.remove('bg-slate-100', 'text-slate-700');
        btnEl.classList.add('bg-slate-900', 'text-white');
    }
    renderStartLiveFeed();
};

window.updateStartLiveCounters = function() {
    const total = State.currentMasterList.length;
    const started = State.currentMasterList.filter(p => p.started === true || p.started === 'true').length;
    const remaining = Math.max(0, total - started);
    const percent = total > 0 ? Math.round((started / total) * 100) : 0;

    const totalEl = document.getElementById('liveTotalRunners');
    const startedEl = document.getElementById('liveStartedRunners');
    const percentEl = document.getElementById('liveStartedPercent');
    const remEl = document.getElementById('liveRemainingRunners');

    if (totalEl) totalEl.textContent = total;
    if (startedEl) startedEl.textContent = started;
    if (percentEl) percentEl.textContent = `(${percent}%)`;
    if (remEl) remEl.textContent = remaining;
};

window.renderStartLiveFeed = function() {
    const tbody = document.getElementById('startLiveTableBody');
    const countBadge = document.getElementById('startLiveTableCount');
    if (!tbody) return;

    const searchInput = document.getElementById('searchStartLive');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let startedList = State.currentMasterList.filter(p => p.started === true || p.started === 'true');

    if (startLiveCategoryFilter !== 'ALL') {
        startedList = startedList.filter(p => {
            const kat = String(p.kategori || '').toUpperCase();
            return kat.includes(startLiveCategoryFilter);
        });
    }

    if (keyword) {
        startedList = startedList.filter(p => {
            const nama = String(p.nama || '').toLowerCase();
            const bib = String(p.bibNumber || '').toLowerCase();
            const gate = String(p.startGate || '').toLowerCase();
            return nama.includes(keyword) || bib.includes(keyword) || gate.includes(keyword);
        });
    }

    startedList.sort((a, b) => {
        const timeA = typeof a.startedAt === 'number' ? a.startedAt : new Date(a.startedAt || 0).getTime();
        const timeB = typeof b.startedAt === 'number' ? b.startedAt : new Date(b.startedAt || 0).getTime();
        return timeB - timeA;
    });

    if (countBadge) {
        countBadge.textContent = `${startedList.length} pelari`;
    }

    if (startedList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-slate-400">Belum ada pelari yang melintasi gerbang start sesuai filter ini.</td></tr>';
        return;
    }

    const rows = startedList.map((p, idx) => {
        let timeStr = '-';
        if (p.startedAt) {
            const d = typeof p.startedAt === 'number' ? new Date(p.startedAt) : new Date(p.startedAt);
            if (!isNaN(d.getTime())) {
                timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
            } else {
                timeStr = String(p.startedAt);
            }
        }

        const cleanKat = (p.kategori || '-').replace(/\s*\([^)]*\)/g, '').trim();

        return `
            <tr class="hover:bg-purple-50/50 transition">
                <td class="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">${idx + 1}</td>
                <td class="py-3.5 px-4 font-mono font-bold text-emerald-700">${escapeHtml(timeStr)} <span class="text-[10px] text-slate-400">WIB</span></td>
                <td class="py-3.5 px-4">
                    <span class="font-mono font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 text-xs">${escapeHtml(p.bibNumber || '-')}</span>
                </td>
                <td class="py-3.5 px-4 font-bold text-slate-900 uppercase">${escapeHtml(p.nama)}</td>
                <td class="py-3.5 px-4 text-slate-600 font-medium text-xs">${escapeHtml(cleanKat)}</td>
                <td class="py-3.5 px-4 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">${escapeHtml(p.startGate || 'Gate 1')}</span>
                </td>
                <td class="py-3.5 px-4 text-center">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span>Di Jalur Lomba</span>
                    </span>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join('');
};

window.toggleStartFullscreen = function() {
    const elem = document.getElementById('page-startlive');
    if (!elem) return;

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

// Reset Seluruh Data Pelari yang Sudah Start (Admin / Panitia)
window.resetAllStartGateData = async function() {
    const startedRunners = State.currentMasterList.filter(p => p.started === true || p.started === 'true' || p.started === 'TRUE');
    
    if (startedRunners.length === 0) {
        window.customAlert("Saat ini belum ada pelari yang melintasi garis start (data monitor sudah bersih / 0 pelari start).", "info", "Data Sudah Bersih");
        return;
    }

    const confirmReset = await window.customConfirm(
        `<div class="text-left space-y-2">
            <p>Anda akan mereset <strong>${startedRunners.length} peserta</strong> yang saat ini tercatat sudah melintasi garis start.</p>
            <p class="text-xs text-rose-600 font-bold">Semua pelari tersebut akan dikembalikan ke status "Belum Start" (Waktu start & Gate akan dikosongkan).</p>
            <p class="text-xs text-slate-500">Profil pendaftaran, nomor BIB, dan status check-in peserta TIDAK akan terhapus.</p>
            <p class="text-xs font-bold text-slate-700 mt-2">Apakah Anda yakin ingin melanjutkan reset?</p>
        </div>`,
        "Konfirmasi Reset Start Gate"
    );

    if (!confirmReset) return;

    window.showLoading(true, "Mereset data start pelari di Firebase...");

    try {
        const db = getDb();
        const updatePromises = startedRunners.map(async (p) => {
            p.started = false;
            p.startedAt = null;
            p.startGate = "";
            if (db) {
                return db.collection('peserta').doc(p.kode).set({
                    started: false,
                    startedAt: null,
                    startGate: ""
                }, { merge: true });
            }
        });

        await Promise.all(updatePromises);

        recentGateScans = [];
        renderGateRecentList();
        updateStartGateCounters();
        renderStartLiveFeed();
        updateStartLiveCounters();

        window.showLoading(false);
        window.customAlert(
            `Berhasil! Seluruh data Start Gate telah dibersihkan (${startedRunners.length} peserta di-reset ke status Belum Start).`,
            "success",
            "Reset Selesai"
        );
    } catch (err) {
        window.showLoading(false);
        console.error("Gagal mereset data start:", err);
        window.customAlert("Gagal mereset data start: " + err.message, "error");
    }
};

