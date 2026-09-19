/**
 * Alpha Chase Run (ACR 2026) - Modul Berkas & Dokumen Peserta
 * 1. Surat Ijin Orang Tua
 * 2. Surat Kuasa (Pengambilan Race Pack)
 * 3. Surat Pernyataan Sehat
 */

(function () {
    'use strict';

    // 3 Macam Berkas Resmi ACR 2026
    const DEFAULT_BERKAS_LIST = [
        {
            id: 'berkas_1',
            nama: 'Surat Izin Orang Tua',
            kategori: 'Wajib - Pelajar & Kids (< 17 Thn)',
            badgeColor: 'amber',
            icon: '👨‍👩‍👦',
            deskripsi: 'Surat persetujuan resmi dari orang tua atau wali bagi peserta di bawah usia 17 tahun (Kategori 5K Pelajar dan 2.5K Kids). Wajib ditandatangani orang tua/wali dan diserahkan saat pengambilan Race Pack.',
            fileName: 'Surat_Izin_Orang_Tua_ACR2026.pdf',
            fileUrl: '',
            fileSize: '',
            linkUrl: '',
            updatedAt: ''
        },
        {
            id: 'berkas_2',
            nama: 'Surat Kuasa',
            kategori: 'Khusus Pengambilan Diwakilkan',
            badgeColor: 'purple',
            icon: '📝',
            deskripsi: 'Surat kuasa resmi bermaterai apabila pengambilan Race Pack (BIB, Jersey, Tas Serut) diwakilkan oleh orang lain/pihak ketiga. Wajib melampirkan fotokopi KTP pemberi dan penerima kuasa.',
            fileName: 'Surat_Kuasa_ACR2026.pdf',
            fileUrl: '',
            fileSize: '',
            linkUrl: '',
            updatedAt: ''
        },
        {
            id: 'berkas_3',
            nama: 'Surat Pernyataan Sehat',
            kategori: 'Wajib - Seluruh Peserta',
            badgeColor: 'emerald',
            icon: '🩺',
            deskripsi: 'Surat pernyataan mandiri bahwa peserta berada dalam kondisi fisik sehat prima, bugar, tidak memiliki riwayat komorbid berisiko tinggi, dan siap secara medis mengikuti perlombaan lari Alpha Chase Run 2026.',
            fileName: 'Surat_Pernyataan_Sehat_ACR2026.pdf',
            fileUrl: '',
            fileSize: '',
            linkUrl: '',
            updatedAt: ''
        }
    ];

    let berkasList = JSON.parse(JSON.stringify(DEFAULT_BERKAS_LIST));

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function loadLocalBerkas() {
        try {
            const stored = localStorage.getItem('acr_local_berkas_v3');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length === 3 && parsed[0].id === 'berkas_1') {
                    berkasList = parsed;
                    return;
                }
            }
        } catch (e) {
            console.warn("Gagal memuat berkas lokal v3:", e);
        }
        berkasList = JSON.parse(JSON.stringify(DEFAULT_BERKAS_LIST));
        saveLocalBerkas();
    }

    function saveLocalBerkas() {
        try {
            localStorage.setItem('acr_local_berkas_v3', JSON.stringify(berkasList));
        } catch (e) {
            console.warn("Gagal menyimpan berkas lokal v3:", e);
        }
    }

    function getFirestoreDb() {
        return window.FirebaseBridge ? window.FirebaseBridge.getDb() : null;
    }

    // Listener Real-time Firestore untuk Berkas
    function setupFirestoreBerkasListener() {
        const db = getFirestoreDb();
        if (!db) return;

        try {
            db.collection('settings').doc('event_berkas').onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data && Array.isArray(data.items) && data.items.length === 3) {
                        // Pastikan tipe data baru (Surat Ijin Orang Tua, Surat Kuasa, Surat Pernyataan Sehat)
                        if (data.items[1] && data.items[1].nama && data.items[1].nama.toLowerCase().includes('kuasa')) {
                            berkasList = data.items;
                            saveLocalBerkas();
                            refreshBerkasUI();
                            return;
                        }
                    }
                }
                // Jika data di firestore masih versi lama atau belum ada, perbarui ke versi 3 berkas baru
                db.collection('settings').doc('event_berkas').set({
                    items: berkasList,
                    version: 2,
                    updatedAt: new Date().toISOString()
                }).catch(console.warn);
            }, (err) => {
                console.warn("Snapshot event_berkas offline/gagal:", err);
            });
        } catch (err) {
            console.warn("Setup listener berkas gagal:", err);
        }
    }

    function refreshBerkasUI() {
        renderBerkasInfoCards();
        renderStatusBerkasQuickBtns();
        if (window.State && window.State.activePage === 'unduhberkas') renderBerkasPublicPage();
        if (window.State && window.State.activePage === 'berkas') renderBerkasAdminPage();
    }

    // 1. Render Halaman Upload Berkas untuk Panitia & Admin
    function renderBerkasAdminPage() {
        const container = document.getElementById('berkasAdminCardsContainer');
        if (!container) return;

        container.innerHTML = berkasList.map((b, idx) => {
            const hasCustomFile = b.fileUrl && b.fileUrl.startsWith('data:');
            const hasCustomLink = b.linkUrl && b.linkUrl.trim() !== '';

            let statusBadgeHtml = '';
            if (hasCustomFile) {
                statusBadgeHtml = `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>File Terunggah: <strong>${escapeHtml(b.fileName || 'Dokumen.pdf')}</strong> (${escapeHtml(b.fileSize || 'Ukuran')})</span>
                    </div>`;
            } else if (hasCustomLink) {
                statusBadgeHtml = `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold truncate max-w-full">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span class="truncate">Tautan Cloud: <strong>${escapeHtml(b.linkUrl)}</strong></span>
                    </div>`;
            } else {
                statusBadgeHtml = `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">
                        <span>⚡ Template Dokumen Standar Resmi ACR (Siap Unduh)</span>
                    </div>`;
            }

            return `
                <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm transition hover:shadow-md">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">${b.icon || '📄'}</span>
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800">
                                        Berkas #${idx + 1}
                                    </span>
                                    <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                                        ${escapeHtml(b.kategori)}
                                    </span>
                                </div>
                                <h3 class="text-lg sm:text-xl font-bold text-slate-800 mt-1">${escapeHtml(b.nama)}</h3>
                            </div>
                        </div>
                        <div>
                            ${statusBadgeHtml}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Nama Dokumen</label>
                            <input type="text" id="berkas_nama_${b.id}" value="${escapeHtml(b.nama)}" class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-semibold">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Kategori / Sasaran Peserta</label>
                            <input type="text" id="berkas_kat_${b.id}" value="${escapeHtml(b.kategori)}" class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-semibold">
                        </div>
                    </div>

                    <div class="mb-5">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Petunjuk untuk Peserta</label>
                        <textarea id="berkas_desc_${b.id}" rows="2" class="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none leading-relaxed">${escapeHtml(b.deskripsi)}</textarea>
                    </div>

                    <!-- Bagian Upload & Link -->
                    <div class="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <p class="text-xs font-bold text-slate-800">1. Unggah File Dokumen Langsung</p>
                                <p class="text-[11px] text-slate-500">Mendukung format PDF, DOCX, DOC, atau Gambar (Maks 800 KB untuk penyimpanan awan).</p>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <label class="cursor-pointer px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                    <span>Pilih File Baru</span>
                                    <input type="file" accept=".pdf,.doc,.docx,image/*" onchange="window.handleBerkasFileSelect('${b.id}', this)" class="hidden">
                                </label>

                                <button type="button" onclick="window.downloadBerkas('${b.id}')" class="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer">
                                    <span>👁️ Pratinjau / Unduh</span>
                                </button>

                                ${(hasCustomFile || hasCustomLink) ? `
                                    <button type="button" onclick="window.removeBerkasFile('${b.id}')" class="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer">
                                        <span>🗑️ Reset</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="border-t border-slate-200 pt-3">
                            <label class="block text-xs font-bold text-slate-800 mb-1">
                                2. Atau Masukkan Tautan Eksternal (Google Drive / Dropbox / Cloud Storage)
                            </label>
                            <div class="relative flex items-center">
                                <input type="url" id="berkas_link_${b.id}" value="${escapeHtml(b.linkUrl || '')}" placeholder="https://drive.google.com/file/d/..." class="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 outline-none pr-20 font-mono">
                                ${b.linkUrl ? `
                                    <a href="${b.linkUrl}" target="_blank" class="absolute right-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition">
                                        Tes Buka ↗
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    // 2. Render Halaman Unduh Berkas untuk Publik
    function renderBerkasPublicPage() {
        const container = document.getElementById('berkasPublicCardsContainer');
        if (!container) return;

        container.innerHTML = berkasList.map((b) => {
            const hasCustomLink = b.linkUrl && b.linkUrl.trim() !== '';
            const actionLabel = hasCustomLink ? 'Buka Dokumen (Cloud) ↗' : 'Unduh Dokumen (PDF) 📥';

            return `
                <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-lg duration-200">
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl shadow-xs border border-teal-100">
                                ${b.icon || '📄'}
                            </div>
                            <span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                                ${escapeHtml(b.kategori)}
                            </span>
                        </div>

                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-2">${escapeHtml(b.nama)}</h3>
                        <p class="text-xs text-slate-500 leading-relaxed mb-4">${escapeHtml(b.deskripsi)}</p>
                    </div>

                    <div class="pt-4 border-t border-slate-100">
                        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                            <span>Format: <strong>${b.fileName ? b.fileName.split('.').pop().toUpperCase() : 'PDF Siap Cetak'}</strong></span>
                            <span>${escapeHtml(b.fileSize || 'Dokumen Resmi')}</span>
                        </div>

                        <button type="button" onclick="window.downloadBerkas('${b.id}')" class="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <span>${actionLabel}</span>
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    // 3. Render Card Berkas di Halaman Info
    function renderBerkasInfoCards() {
        const container = document.getElementById('infoBerkasCards');
        if (!container) return;

        container.innerHTML = berkasList.map((b) => {
            return `
                <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-2xl">${b.icon || '📄'}</span>
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                ${escapeHtml(b.kategori)}
                            </span>
                        </div>
                        <h4 class="font-bold text-sm text-slate-800 leading-snug mb-1">${escapeHtml(b.nama)}</h4>
                        <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">${escapeHtml(b.deskripsi)}</p>
                    </div>
                    <button type="button" onclick="window.downloadBerkas('${b.id}')" class="w-full py-2 bg-teal-50 hover:bg-teal-100 active:scale-95 text-teal-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 border border-teal-200 cursor-pointer">
                        <span>Unduh ${b.fileName ? b.fileName.split('.').pop().toUpperCase() : 'PDF'}</span>
                        <span>📥</span>
                    </button>
                </div>`;
        }).join('');
    }

    // 4. Render Tombol Cepat di Halaman Status
    function renderStatusBerkasQuickBtns() {
        const container = document.getElementById('statusBerkasQuickBtns');
        if (!container) return;

        container.innerHTML = berkasList.map((b, idx) => {
            return `
                <button type="button" onclick="window.downloadBerkas('${b.id}')" class="px-2.5 py-2 bg-white hover:bg-teal-50 active:scale-95 border border-teal-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition shadow-xs cursor-pointer">
                    <span class="truncate pr-1">${idx + 1}. ${escapeHtml(b.nama.split('(')[0].trim())}</span>
                    <span class="text-teal-600 flex-shrink-0">📥</span>
                </button>`;
        }).join('');
    }

    // 5. Handler Simpan Semua Berkas (Panitia & Admin)
    window.saveAllBerkas = async function () {
        if (typeof window.showLoading === 'function') {
            window.showLoading(true, "Menyimpan Berkas...");
        }

        // Ambil data dari form input jika berada di page berkas
        berkasList.forEach((b) => {
            const namaInput = document.getElementById(`berkas_nama_${b.id}`);
            const katInput = document.getElementById(`berkas_kat_${b.id}`);
            const descInput = document.getElementById(`berkas_desc_${b.id}`);
            const linkInput = document.getElementById(`berkas_link_${b.id}`);

            if (namaInput) b.nama = namaInput.value.trim() || b.nama;
            if (katInput) b.kategori = katInput.value.trim() || b.kategori;
            if (descInput) b.deskripsi = descInput.value.trim() || b.deskripsi;
            if (linkInput) b.linkUrl = linkInput.value.trim();
        });

        saveLocalBerkas();

        const db = getFirestoreDb();
        if (db) {
            try {
                await db.collection('settings').doc('event_berkas').set({
                    items: berkasList,
                    version: 2,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            } catch (err) {
                console.warn("Gagal sync berkas ke Firestore:", err);
            }
        }

        if (typeof window.showLoading === 'function') {
            window.showLoading(false);
        }

        refreshBerkasUI();

        if (typeof window.customAlert === 'function') {
            await window.customAlert("3 Berkas ACR berhasil disimpan & dipublikasikan!<br><br>1. Surat Ijin Orang Tua<br>2. Surat Kuasa<br>3. Surat Pernyataan Sehat", "success", "Berkas Tersimpan");
        } else {
            alert("3 Berkas ACR berhasil disimpan!");
        }
    };

    // 6. Handler Upload File Dokumen Langsung
    window.handleBerkasFileSelect = function (berkasId, inputEl) {
        if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
        const file = inputEl.files[0];

        if (file.size > 850 * 1024) {
            if (typeof window.customAlert === 'function') {
                window.customAlert(`Ukuran file "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas penyimpanan langsung Firestore (maksimal 800 KB).<br><br>💡 <strong>Solusi:</strong> Silakan upload file PDF Anda ke <strong>Google Drive / Dropbox</strong>, lalu masukkan linknya pada kolom <strong>'Tautan Eksternal'</strong>.`, "warning", "File Terlalu Besar");
            } else {
                alert("File melebihi 800 KB. Silakan gunakan tautan Google Drive.");
            }
            inputEl.value = '';
            return;
        }

        if (typeof window.showLoading === 'function') {
            window.showLoading(true, `Membaca file ${file.name}...`);
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const item = berkasList.find(b => b.id === berkasId);
            if (item) {
                item.fileUrl = e.target.result;
                item.fileName = file.name;
                item.fileSize = `${(file.size / 1024).toFixed(0)} KB`;
                item.updatedAt = new Date().toLocaleDateString('id-ID');
            }
            if (typeof window.showLoading === 'function') {
                window.showLoading(false);
            }
            renderBerkasAdminPage();
            if (typeof window.customAlert === 'function') {
                window.customAlert(`File <strong>${file.name}</strong> berhasil dipilih! Klik tombol <strong>'Simpan Semua Berkas'</strong> untuk mempublikasikan.`, "success", "File Siap");
            }
        };
        reader.onerror = function () {
            if (typeof window.showLoading === 'function') {
                window.showLoading(false);
            }
            if (typeof window.customAlert === 'function') {
                window.customAlert("Gagal membaca file yang dipilih.", "error");
            }
        };
        reader.readAsDataURL(file);
    };

    // 7. Handler Reset File Dokumen
    window.removeBerkasFile = function (berkasId) {
        const item = berkasList.find(b => b.id === berkasId);
        if (item) {
            item.fileUrl = '';
            item.fileName = '';
            item.fileSize = '';
            item.linkUrl = '';
            renderBerkasAdminPage();
            if (typeof window.customAlert === 'function') {
                window.customAlert(`File khusus untuk berkas ini telah direset. Sistem akan menggunakan template dokumen standar resmi saat peserta mengunduh.`, "info", "File Direset");
            }
        }
    };

    // 8. Handler Download Berkas untuk Peserta / Panitia
    window.downloadBerkas = async function (berkasId) {
        const item = berkasList.find(b => b.id === berkasId) || DEFAULT_BERKAS_LIST.find(b => b.id === berkasId);
        if (!item) {
            if (typeof window.customAlert === 'function') {
                window.customAlert("Dokumen tidak ditemukan.", "error");
            }
            return;
        }

        // A. Jika ada tautan eksternal (Google Drive / Website / Cloud)
        if (item.linkUrl && item.linkUrl.trim() !== '') {
            window.open(item.linkUrl.trim(), '_blank');
            return;
        }

        // B. Jika ada file Base64 yang diunggah langsung oleh panitia
        if (item.fileUrl && item.fileUrl.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = item.fileUrl;
            a.download = item.fileName || `${item.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // C. Jika belum ada file khusus yang diunggah panitia, buat file template PDF resmi ACR menggunakan jsPDF!
        if (typeof window.showLoading === 'function') {
            window.showLoading(true, "Membuat Dokumen PDF Resmi...");
        }
        try {
            if (berkasId === 'berkas_1') {
                generateDefaultSuratIzinPdf(item);
            } else if (berkasId === 'berkas_2') {
                generateDefaultSuratKuasaPdf(item);
            } else {
                generateDefaultSuratSehatPdf(item);
            }
        } catch (err) {
            console.error("Gagal membuat PDF otomatis:", err);
            if (typeof window.customAlert === 'function') {
                window.customAlert("Gagal membuat dokumen PDF: " + err.message, "error");
            }
        } finally {
            if (typeof window.showLoading === 'function') {
                window.showLoading(false);
            }
        }
    };

    // =====================================================================
    // HELPER KOP SURAT & WATERMARK RESMI ALPHA CHASE RUN 2026
    // =====================================================================

    function applyOfficialKopSuratAndWatermark(doc, titleLines, logoSize = 22) {
        const assets = window.ACR_BERKAS_ASSETS || {};

        // 1. Watermark di Tengah Halaman (159 x 159 mm)
        if (assets.watermark) {
            try {
                doc.addImage(assets.watermark, 'JPEG', 25.5, 69, 159, 159);
            } catch (e) {
                console.warn("Gagal menyisipkan watermark berkas:", e);
            }
        }

        // 2. Logo Badge ACR di Pojok Kiri Atas Kop Surat
        if (assets.logoBadge) {
            try {
                doc.addImage(assets.logoBadge, 'JPEG', 22, 14, logoSize, logoSize);
            } catch (e) {
                console.warn("Gagal menyisipkan logo badge berkas:", e);
            }
        }

        // 3. Teks Judul Kop Surat (Tengah, Huruf Kapital, Tebal, Warna Hitam Standar)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);

        let startY = 17;
        if (titleLines.length === 2) {
            startY = 20;
        }

        titleLines.forEach((t, i) => {
            doc.setFontSize(t.size || 13);
            doc.text(t.text, 105, startY + (i * 6.5), { align: "center" });
        });
    }

    // =====================================================================
    // 1. GENERATOR PDF: SURAT PERNYATAAN PERSETUJUAN ORANG TUA
    // =====================================================================

    function generateDefaultSuratIzinPdf(docData) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            if (typeof window.customAlert === 'function') {
                window.customAlert("Modul PDF belum siap, silakan coba sesaat lagi.", "error");
            }
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        applyOfficialKopSuratAndWatermark(doc, [
            { text: "SURAT PERNYATAAN PERSETUJUAN ORANG TUA", size: 12.5 },
            { text: "ALPHA CHASE RUN 2026", size: 12.5 }
        ]);

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        let y = 44;
        doc.text("Yang bertanda tangan di bawah ini :", 25.4, y);

        y += 5.8;
        const fieldsOrtu = [
            ["Nama Lengkap", ": ............................................................................................"],
            ["Alamat", ": ............................................................................................"],
            ["No. KTP/SIM", ": ............................................................................................"]
        ];
        fieldsOrtu.forEach(([lbl, dots]) => {
            doc.text(lbl, 25.4, y);
            doc.text(dots, 62, y);
            y += 5.5;
        });

        y += 1;
        doc.text("Merupakan orang tua / wali dari :", 25.4, y);

        y += 5.8;
        const fieldsAnak = [
            ["Nama Lengkap", ": ............................................................................................"],
            ["Sekolah/komunitas", ": ............................................................................................"],
            ["Usia", ": ............................................................................................"],
            ["Kode Run / kategori", ": ............................................................................................"],
            ["Alamat", ": ............................................................................................"],
            ["No. KTP/NIK", ": ............................................................................................"]
        ];
        fieldsAnak.forEach(([lbl, dots]) => {
            doc.text(lbl, 25.4, y);
            doc.text(dots, 62, y);
            y += 5.4;
        });

        y += 1.5;
        doc.text("Dengan ini saya menyatakan bahwa :", 25.4, y);
        y += 5.2;

        const pernyataanList = [
            "Saya telah mengetahui dan menyetujui keikutsertaan anak saya dalam kegiatan Alpha Chase Run 2026.",
            "Saya memastikan bahwa anak saya dalam kondisi sehat dan mampu mengikuti lomba lari Alpha Chase Run 2026.",
            "Saya telah memahami bahwa kegiatan olahraga lari memiliki risiko kelelahan, cedera, maupun risiko kesehatan lainnya.",
            "Saya mengizinkan panitia dan petugas medis memberikan pertolongan pertama apabila diperlukan selama kegiatan.",
            "Saya bertanggung jawab penuh jika terjadi sesuatu pada anak saya, baik pada saat maupun sesudah pelaksanaan lomba lari Alpha Chase Run 2026 dan melepaskan penyelenggara dan panitia Alpha Chase Run dari segala tanggung jawab yang mungkin timbul atas keikutsertaan anak saya sebagai peserta lomba lari Alpha Chase Run 2026.",
            "Saya bertanggung jawab atas kebenaran data dan izin yang saya berikan."
        ];

        pernyataanList.forEach((txt, idx) => {
            const lines = doc.splitTextToSize(`${idx + 1}.  ${txt}`, 159.2);
            doc.text(lines, 25.4, y);
            y += (lines.length * 4.2) + 1;
        });

        y += 1.5;
        const penutup = "Demikian saya nyatakan bahwa surat kuasa ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.";
        const linesPenutup = doc.splitTextToSize(penutup, 159.2);
        doc.text(linesPenutup, 25.4, y);
        y += (linesPenutup.length * 4.2) + 3;

        // Signature & Materai
        doc.text("Bontang,       September  2026", 125, y);

        // Kotak Materai 10.000
        doc.setDrawColor(180, 180, 180);
        doc.setLineDashPattern([1, 1], 0);
        doc.rect(130, y + 3, 26, 15);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text("Materai Rp.10.000", 143, y + 11.5, { align: "center" });
        doc.setLineDashPattern([], 0);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        y += 22;
        doc.text("................................................", 125, y);
        y += 4.5;
        doc.text("Nama Lengkap", 125, y);

        doc.save("Surat_Izin_Orang_Tua_ACR2026.pdf");
    }

    // =====================================================================
    // 2. GENERATOR PDF: SURAT KUASA PENGAMBILAN RACEPACK/JERSEY
    // =====================================================================

    function generateDefaultSuratKuasaPdf(docData) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            if (typeof window.customAlert === 'function') {
                window.customAlert("Modul PDF belum siap, silakan coba sesaat lagi.", "error");
            }
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Kop Surat Resmi: Logo Kiri & Teks Tengah Sesuai Dokumen Asli
        applyOfficialKopSuratAndWatermark(doc, [
            { text: "SURAT KUASA", size: 14 },
            { text: "PENGAMBILAN RACEPACK/JERSEY", size: 13 },
            { text: "ALPHA CHASE RUN 2026", size: 13 }
        ]);

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);

        let y = 47;
        doc.text("Dengan ini, saya :", 25.4, y);

        y += 6.5;
        const fieldsP1 = [
            ["Nama Lengkap", ": ............................................................................................"],
            ["Alamat", ": ............................................................................................"],
            ["Kode Run", ": ............................................................................................"],
            ["No. KTP/NIK", ": ............................................................................................"]
        ];

        fieldsP1.forEach(([lbl, dots]) => {
            doc.text(lbl, 25.4, y);
            doc.text(dots, 60, y);
            y += 6.5;
        });

        y += 1.5;
        doc.text("Memberikan kuasa sepenuhnya kepada :", 25.4, y);

        y += 6.5;
        const fieldsP2 = [
            ["Nama Lengkap", ": ............................................................................................"],
            ["Alamat", ": ............................................................................................"],
            ["No. KTP/NIK", ": ............................................................................................"]
        ];

        fieldsP2.forEach(([lbl, dots]) => {
            doc.text(lbl, 25.4, y);
            doc.text(dots, 60, y);
            y += 6.5;
        });

        y += 1.5;
        const p1 = "Untuk mengambil perlengkapan lomba / racepack atas nama saya tersebut di atas dengan membawa berkas yang dibutuhkan untuk syarat pengambilan seperti yang tertera di bawah ini :";
        const linesP1 = doc.splitTextToSize(p1, 159.2);
        doc.text(linesP1, 25.4, y);
        y += (linesP1.length * 4.8) + 1.5;

        const bullets = [
            "Fotocopy KTP/SIM/KK",
            "Surat pernyataan Sehat",
            "Surat izin Orang tua (untuk kategori kids dan pelajar)"
        ];
        bullets.forEach(b => {
            doc.text("•   " + b, 29, y);
            y += 5.2;
        });

        y += 1.5;
        const p2 = "Dalam pengambilan perlengkapan lomba / race pack ini, kuasa saya akan menunjukkan identitasnya untuk proses verifikasi data dan saya menyetujui bahwa jika kuasa saya tidak dapat menunjukkan surat kuasa ini maka Panitia berhak untuk menolak pengambilan perlengkapan lomba / race pack saya.";
        const linesP2 = doc.splitTextToSize(p2, 159.2);
        doc.text(linesP2, 25.4, y);
        y += (linesP2.length * 4.8) + 2.5;

        const p3 = "Demikian saya nyatakan bahwa surat kuasa ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.";
        const linesP3 = doc.splitTextToSize(p3, 159.2);
        doc.text(linesP3, 25.4, y);
        y += (linesP3.length * 4.8) + 6;

        // Tanda Tangan
        doc.text("Bontang,       September  2026", 125, y);
        y += 24;
        doc.text("................................................", 125, y);
        y += 5;
        doc.text("Nama Lengkap", 125, y);

        doc.save("Surat_Kuasa_ACR2026.pdf");
    }

    // =====================================================================
    // 3. GENERATOR PDF: SURAT PERNYATAAN SEHAT
    // =====================================================================

    function generateDefaultSuratSehatPdf(docData) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            if (typeof window.customAlert === 'function') {
                window.customAlert("Modul PDF belum siap, silakan coba sesaat lagi.", "error");
            }
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        applyOfficialKopSuratAndWatermark(doc, [
            { text: "SURAT PERNYATAAN SEHAT", size: 14 },
            { text: "PELARI ALPHA CHASE RUN 2026", size: 13.5 }
        ]);

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);

        let y = 46;
        doc.text("Dengan ini, saya :", 25.4, y);

        y += 6.5;
        const fieldsSehat = [
            ["Nama Lengkap", ": ............................................................................................"],
            ["Tempat, Tanggal lahir", ": ............................................................................................"],
            ["Jenis kelamin", ": Laki – laki / Perempuan"],
            ["Alamat", ": ............................................................................................"],
            ["Kode Run", ": ............................................................................................"],
            ["No. KTP/NIK", ": ............................................................................................"],
            ["No. Telepon", ": ............................................................................................"]
        ];
        fieldsSehat.forEach(([lbl, dots]) => {
            doc.text(lbl, 25.4, y);
            doc.text(dots, 65, y);
            y += 6.2;
        });

        y += 2;
        doc.text("Dengan ini menyatakan bahwa :", 25.4, y);
        y += 6;

        const poinSehatList = [
            "Saya dalam kondisi sehat dan mampu secara fisik untuk mengikuti kegiatan Alpha Chase Run 2026.",
            "Saya memahami bahwa aktivitas lari memiliki risiko kelelahan, cedera, maupun kondisi kesehatan lainnya.",
            "Saya bersedia mengikuti seluruh ketentuan dan arahan panitia selama kegiatan berlangsung.",
            "Apabila selama kegiatan saya mengalami keluhan atau gangguan kesehatan, saya bersedia menghentikan aktivitas dan segera melapor kepada petugas medis.",
            "Saya menyatakan bersedia menanggung segala resiko apabila terjadi hal yang menimbulkan kerugian baik fisik maupun non-materil, saya tidak akan menuntut kepada siapapun juga serta bertanggung jawab sendiri bila terjadi sesuatu hal atas diri saya selama mengikuti perlombaan Alpha Chase Run 2026."
        ];

        poinSehatList.forEach((txt, idx) => {
            const lines = doc.splitTextToSize(`${idx + 1}.  ${txt}`, 159.2);
            doc.text(lines, 25.4, y);
            y += (lines.length * 4.6) + 1.8;
        });

        y += 2;
        const penutupSehat = "Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dalam keadaan sadar dan tanpa paksaan dari pihak mana pun untuk dapat dipergunakan sebagaimana mestinya.";
        const linesPenutupSehat = doc.splitTextToSize(penutupSehat, 159.2);
        doc.text(linesPenutupSehat, 25.4, y);
        y += (linesPenutupSehat.length * 4.6) + 6;

        // Tanda Tangan
        doc.text("Bontang,       September  2026", 125, y);
        y += 24;
        doc.text("................................................", 125, y);
        y += 5;
        doc.text("Nama Lengkap", 125, y);

        doc.save("Surat_Pernyataan_Sehat_ACR2026.pdf");
    }

    // Intercept dan hook ke window.nav
    function hookNavigation() {
        const origNav = window.nav;
        if (typeof origNav !== 'function') {
            setTimeout(hookNavigation, 50);
            return;
        }

        window.nav = function (pageId) {
            // Guard: Halaman berkas hanya untuk panitia & superadmin
            if (pageId === 'berkas') {
                const currentRole = (window.State && window.State.role) || sessionStorage.getItem('acr_role') || 'guest';
                if (currentRole === 'guest') {
                    pageId = 'akun';
                }
            }

            origNav(pageId);

            requestAnimationFrame(() => {
                if (pageId === 'berkas') renderBerkasAdminPage();
                if (pageId === 'unduhberkas') renderBerkasPublicPage();
                if (pageId === 'info') renderBerkasInfoCards();
                if (pageId === 'status') renderStatusBerkasQuickBtns();
            });
        };
    }

    // Inisialisasi Saat Load
    function initBerkasModule() {
        loadLocalBerkas();
        hookNavigation();
        setupFirestoreBerkasListener();

        // Render card info di halaman awal
        requestAnimationFrame(() => {
            renderBerkasInfoCards();
            renderStatusBerkasQuickBtns();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBerkasModule);
    } else {
        initBerkasModule();
    }

    // Ekspor fungsi global untuk dipanggil UI
    window.renderBerkasAdminPage = renderBerkasAdminPage;
    window.renderBerkasPublicPage = renderBerkasPublicPage;
    window.renderBerkasInfoCards = renderBerkasInfoCards;
    window.renderStatusBerkasQuickBtns = renderStatusBerkasQuickBtns;
})();
