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
    const adminPages = ['dashboard', 'master', 'logistik', 'checkin', 'pengaturan'];
    if (adminPages.includes(pageId) && State.role === 'guest') {
        pageId = 'akun';
    }
    if (State.role === 'panitia' && (pageId === 'dashboard' || pageId === 'master' || pageId === 'pengaturan')) {
        pageId = 'checkin';
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
        await db.collection('peserta').doc(kode).update(updateFields);
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
window.customAlert = function(message, type = 'info', title = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const iconDiv = document.getElementById('customModalIcon');
        const titleEl = document.getElementById('customModalTitle');
        const descEl = document.getElementById('customModalDesc');
        const actionsDiv = document.getElementById('customModalActions');

        descEl.innerHTML = message;
        if (type === 'error') {
            iconDiv.className = "w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4";
            iconDiv.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
            titleEl.textContent = title || "Terjadi Kesalahan";
        } else if (type === 'success') {
            iconDiv.className = "w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4";
            iconDiv.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            titleEl.textContent = title || "Berhasil";
        } else if (type === 'warning') {
            iconDiv.className = "w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4";
            iconDiv.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
            titleEl.textContent = title || "Peringatan";
        } else {
            iconDiv.className = "w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4";
            iconDiv.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            titleEl.textContent = title || "Informasi";
        }

        actionsDiv.innerHTML = `<button id="customModalOkBtn" class="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition text-sm shadow-md">OK Mengerti</button>`;
        modal.classList.remove('hidden');

        document.getElementById('customModalOkBtn').onclick = () => {
            modal.classList.add('hidden');
            resolve(true);
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

        descEl.innerHTML = message;
        titleEl.textContent = title;
        iconDiv.className = "w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4";
        iconDiv.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

        actionsDiv.innerHTML = `
            <button id="customModalCancelBtn" class="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition text-sm border border-slate-200">Batal</button>
            <button id="customModalConfirmBtn" class="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-sm shadow-md">Ya, Lanjutkan</button>
        `;
        modal.classList.remove('hidden');

        document.getElementById('customModalConfirmBtn').onclick = () => { modal.classList.add('hidden'); resolve(true); };
        document.getElementById('customModalCancelBtn').onclick = () => { modal.classList.add('hidden'); resolve(false); };
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
    
    const newBib = catPrefix + "-" + String(State.currentMasterList.length + 1).padStart(3, '0');
    
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
        } else { 
            bibBox.classList.add('hidden'); 
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
            jHtml += `<div class="flex justify-between items-center bg-slate-50 p-3 mb-2 rounded-xl border border-slate-100"><span class="font-bold text-slate-700">Ukuran ${size}</span><span class="bg-blue-100 text-blue-700 py-1 px-3 rounded-lg font-bold">${jerseyCount[size]}</span></div>`;
        }
    }
    document.getElementById('logistikJersey').innerHTML = list.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs">Belum ada data pendaftar.</div>' : jHtml;

    let kHtml = '';
    for (let kat in katCount) {
        kHtml += `<div class="flex justify-between items-center bg-slate-50 p-3 mb-2 rounded-xl border border-slate-100"><span class="font-bold text-slate-700">${kat}</span><span class="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-lg font-bold">${katCount[kat]}</span></div>`;
    }
    document.getElementById('logistikKategori').innerHTML = list.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs">Belum ada data pendaftar.</div>' : kHtml;
    document.getElementById('logistikHistoryList').innerHTML = historyHtml === '' ? '<div class="text-center py-6 text-slate-400 text-xs">Belum ada riwayat pengambilan.</div>' : historyHtml;
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
        const nama = (p.nama || '').toLowerCase();
        const bibName = (p.bibName || '').toLowerCase();
        const bibNumber = (p.bibNumber || '').toLowerCase();
        const kode = (p.kode || '').toLowerCase();
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

    const rows = matches.map(p => `
        <div onclick="showBibScreen('${p.kode}')" class="p-3 sm:p-4 hover:bg-indigo-50 cursor-pointer transition flex justify-between items-center group">
            <div>
                <div class="font-bold text-slate-800 text-sm group-hover:text-indigo-600 uppercase">${p.nama}</div>
                <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>${(p.kategori || '-').replace(/\s*\([^)]*\)/g, '').trim()}</span>
                    <span class="text-slate-300">•</span>
                    <span class="font-mono text-blue-600 font-bold">BIB: ${p.bibNumber || 'Belum ada BIB'}</span>
                    <span class="text-slate-300">•</span>
                    <span class="font-mono text-slate-400">${p.kode}</span>
                </div>
            </div>
            <button type="button" class="px-3 py-1 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1">
                <span>Pilih</span> 📸
            </button>
        </div>
    `);

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
        const nama = (p.nama || '').toLowerCase();
        const bibName = (p.bibName || '').toLowerCase();
        const bibNumber = (p.bibNumber || '').toLowerCase();
        const kode = (p.kode || '').toLowerCase();
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

    // Sembunyikan dropdown hasil
    const resBox = document.getElementById('bibSearchResults');
    if (resBox) resBox.classList.add('hidden');

    // Bersihkan nominal rupiah, contoh "5K Pelajar (Rp 175.000)" -> "5K PELAJAR"
    let rawKat = (p.kategori || '5K Pelajar').replace(/\s*\([^)]*\)/g, '').trim();
    let kategoriDisplay = rawKat.toUpperCase();
    let bibDisplay = p.bibNumber || p.kode || '-';

    document.getElementById('dispBibKategori').textContent = kategoriDisplay;
    document.getElementById('dispBibNumber').textContent = bibDisplay;
    document.getElementById('dispBibName').textContent = (p.bibName && p.bibName.trim()) ? p.bibName.toUpperCase() : p.nama.toUpperCase();
    document.getElementById('dispNamaLengkap').textContent = p.nama.toUpperCase();
    document.getElementById('dispBibJersey').textContent = p.jersey || '-';
    document.getElementById('dispBibKode').textContent = p.kode;

    const statusBadge = document.getElementById('dispBibStatusBadge');
    if (statusBadge) {
        if (p.status === 'Verified') {
            statusBadge.className = "px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-1";
            statusBadge.innerHTML = "<span>✅ Verified / Siap Lomba</span>";
        } else {
            statusBadge.className = "px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200 flex items-center gap-1";
            statusBadge.innerHTML = `<span>⏳ ${p.status}</span>`;
        }
    }

    const wrapper = document.getElementById('bibDisplayWrapper');
    if (wrapper) wrapper.classList.remove('hidden');

    const searchContainer = document.getElementById('bibSearchContainer');
    if (searchContainer) searchContainer.classList.add('hidden');

    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.resetBibSearch = function() {
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
