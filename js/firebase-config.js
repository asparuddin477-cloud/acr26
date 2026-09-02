/**
 * Konfigurasi Firebase untuk Alpha Chase Run
 * 
 * Anda dapat memasukkan konfigurasi Firebase Web App Anda di sini,
 * ATAU mengisinya langsung melalui UI (tombol 'Koneksi Firebase' di aplikasi).
 */

const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDNcFA06yGys4z2HOkyxtpaFxDdLtQl6WM",
    authDomain: "acr-event-2026.firebaseapp.com",
    projectId: "acr-event-2026",
    storageBucket: "acr-event-2026.firebasestorage.app",
    messagingSenderId: "236752727538",
    appId: "1:236752727538:web:2365d3945550afbd824f6b",
    measurementId: "G-WC9WG6NYGX"
};

// Cek apakah ada konfigurasi tersimpan di localStorage
function getStoredConfig() {
    try {
        const stored = localStorage.getItem('acr_firebase_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.projectId && parsed.apiKey) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Gagal membaca konfigurasi Firebase dari localStorage:", e);
    }
    return null;
}

// Konfigurasi aktif (DEFAULT_FIREBASE_CONFIG atau localStorage yang cocok)
const storedConfig = getStoredConfig();
let activeFirebaseConfig = (storedConfig && storedConfig.apiKey && storedConfig.projectId === DEFAULT_FIREBASE_CONFIG.projectId)
    ? storedConfig
    : DEFAULT_FIREBASE_CONFIG;

let firebaseApp = null;
let firestoreDb = null;

function isFirebaseConfigured() {
    return Boolean(
        activeFirebaseConfig &&
        activeFirebaseConfig.apiKey &&
        activeFirebaseConfig.apiKey.trim() !== "" &&
        activeFirebaseConfig.projectId &&
        activeFirebaseConfig.projectId.trim() !== ""
    );
}

function initFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn("Firebase belum dikonfigurasi. Silakan isi konfigurasi Firebase Anda.");
        return null;
    }

    try {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(activeFirebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }
        firestoreDb = firebase.firestore();
        console.log("Firebase Firestore berhasil diinisialisasi untuk project:", activeFirebaseConfig.projectId);
        return firestoreDb;
    } catch (error) {
        console.error("Gagal menginisialisasi Firebase:", error);
        return null;
    }
}

function saveFirebaseConfigToStorage(newConfig) {
    try {
        if (typeof newConfig === 'string') {
            newConfig = JSON.parse(newConfig);
        }
        if (!newConfig.apiKey || !newConfig.projectId) {
            throw new Error("Konfigurasi minimal harus memiliki apiKey dan projectId!");
        }
        localStorage.setItem('acr_firebase_config', JSON.stringify(newConfig));
        activeFirebaseConfig = newConfig;
        return true;
    } catch (err) {
        console.error("Gagal menyimpan config Firebase:", err);
        throw err;
    }
}

function clearFirebaseConfigFromStorage() {
    localStorage.removeItem('acr_firebase_config');
    activeFirebaseConfig = DEFAULT_FIREBASE_CONFIG;
}

// Ekspor ke window global untuk kemudahan akses
window.FirebaseBridge = {
    getConfig: () => Object.assign({}, activeFirebaseConfig),
    isConfigured: isFirebaseConfigured,
    init: initFirebase,
    getDb: () => firestoreDb || initFirebase(),
    saveConfig: saveFirebaseConfigToStorage,
    clearConfig: clearFirebaseConfigFromStorage
};
