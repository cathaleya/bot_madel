/**
 * BOT OTOMATIS PENGISIAN INSTRUMEN RESEARCH (PDI-DL, MADEL5C, SUS)
 * -----------------------------------------------------------------
 * PER USER SEQUENTIAL DELAY:
 * 1. Bot memproses 1 USER secara penuh (Register -> PDI-DL -> MADEL5C -> SUS).
 * 2. Menggunakan jeda humanis 5-8 detik antar-instrumen (simulasi membaca/mengisi).
 * 3. Setelah 1 USER selesai 3 instrumen, bot ISTIRAHAT 10 s/d 15 MENIT.
 * 4. Menyimpan state ke 'bot_progress.json' agar bisa di-resume.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ==========================================
// KONFIGURASI BOT
// ==========================================
let BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';
if (BASE_URL.includes('madel5c.com') && !BASE_URL.startsWith('https://')) {
  BASE_URL = BASE_URL.replace('http://', 'https://');
}

const PROGRESS_FILE = path.join(__dirname, 'bot_progress.json');
const QUESTIONS_MADEL_PATH = path.join(__dirname, '../src/app/assessment/madel5c/questions.json');
const QUESTIONS_PRELIM_PATH = path.join(__dirname, '../src/app/assessment/preliminary/questions.json');

// Pengaturan Jeda Per User (dalam menit)
const MIN_DELAY_MINUTES = process.env.FAST_MODE ? 0.05 : 10; // 10 menit per user
const MAX_DELAY_MINUTES = process.env.FAST_MODE ? 0.1 : 15;  // 15 menit per user

// Jadwal 7 Hari (Total 350 Responden)
const DAILY_SCHEDULE = [35, 15, 56, 64, 50, 65, 65]; 

// Data Nama Indonesia (Depan & Belakang)
const FIRST_NAMES_MALE = [
  'Ahmad', 'Aditya', 'Bagus', 'Budi', 'Deni', 'Dimas', 'Eko', 'Fajar', 'Faisal', 'Gelar',
  'Hendra', 'Irfan', 'Indra', 'Joko', 'Kevin', 'Lukman', 'Muhammad', 'Miftah', 'Naufal', 'Okta',
  'Pratama', 'Randi', 'Rizky', 'Rian', 'Rangga', 'Satria', 'Taufik', 'Wahyu', 'Yosep', 'Zainal',
  'Agus', 'Bayu', 'Candra', 'Daffa', 'Fadhil', 'Gilang', 'Hafiz', 'Iqbal', 'Kiki', 'Reza'
];

const FIRST_NAMES_FEMALE = [
  'Anisa', 'Ayu', 'Citra', 'Dwi', 'Desi', 'Elsa', 'Fitri', 'Gita', 'Hani', 'Indah',
  'Intan', 'Lestari', 'Maya', 'Nabila', 'Nur', 'Putri', 'Rina', 'Siti', 'Suci', 'Tania',
  'Utami', 'Vina', 'Winda', 'Yulia', 'Zahra', 'Adelia', 'Bella', 'Clarissa', 'Dian', 'Eka',
  'Farida', 'Hanum', 'Ika', 'Kartika', 'Lia', 'Nadia', 'Rahma', 'Salsabila', 'Tika', 'Wulan'
];

const LAST_NAMES = [
  'Pratama', 'Saputra', 'Wijaya', 'Kusuma', 'Hidayat', 'Nugroho', 'Wibowo', 'Santoso', 'Permana', 'Laksana',
  'Ramadhan', 'Utama', 'Setiawan', 'Firmansyah', 'Suryana', 'Kurniawan', 'Fadilah', 'Hidayatullah', 'Syahputra', 'Mahendra',
  'Sanjaya', 'Ardiansyah', 'Budiman', 'Gunawan', 'Purnama', 'Wicaksono', 'Subakti', 'Tanjung', 'Lazuardi', 'Fauzi',
  'Wibisono', 'Kuswandi', 'Suhendar', 'Hartanto', 'Riyadi', 'Yulianto', 'Nugraha', 'Prasetya', 'Kurnia', 'Adiputra'
];

const CAMPUSES = ['UNJ', 'UHAMKA', 'Atmajaya', 'UNIPA', 'UNY', 'UPI', 'UNM'];
const ORIGINS = ['Jawa', 'Luar Jawa'];

const FEEDBACK_LIST = [
  "Tampilan instrumen sangat intuitif dan mudah dipahami.",
  "Sistem sangat membantu dalam memetakan kompetensi literasi digital.",
  "Skenario soal sangat relevan dengan situasi nyata di sekolah.",
  "Petunjuk pengerjaan cukup jelas dan alur transisi halaman lancar.",
  "Sangat bermanfaat untuk asesmen mandiri calon pendidik.",
  "Rekomendasi yang diberikan sangat informatif dan mendidik.",
  "Sistem responsif dan tidak ada kendala saat pengisian.",
  "Sangat menyukai visualisasi radar chart pada hasil evaluasi.",
  "Tampilan clean, modern, dan navigasinya mudah digunakan.",
  "Pertanyaan berbasis skenario membuat proses asesmen lebih menarik."
];

// Set untuk tracking nama unik
const usedNames = new Set();

function generateUniqueName(gender) {
  const firstList = gender === 'Laki-Laki' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
  let name = '';
  let attempts = 0;
  
  do {
    const first = firstList[Math.floor(Math.random() * firstList.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    name = `${first} ${last}`;
    attempts++;
    if (attempts > 500) {
      name = `${first} ${last} ${Math.floor(Math.random() * 90 + 10)}`;
    }
  } while (usedNames.has(name));

  usedNames.add(name);
  return name;
}

// ==========================================
// UTILS PSIKOMETRI & HITUNG SKOR
// ==========================================
function randn_bm() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function erf(x) {
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalCDF(x) {
  return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
}

// Helper HTTP Request (JSON API with Auto 301/302 Redirect & SSL Handling)
function sendPostRequest(endpoint, payload, currentBaseUrl = BASE_URL) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, currentBaseUrl);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `${url.protocol}//${url.host}${redirectUrl}`;
        }
        return sendPostRequest(endpoint, payload, redirectUrl).then(resolve).catch(reject);
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// STATE PERSISTENCE (RESUME CAPABILITY)
// ==========================================
function loadState() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch (e) {
      console.error("Gagal membaca file progress, membuat state baru...");
    }
  }
  return { completedUsers: 0, currentDay: 0, users: [] };
}

function saveState(state) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ==========================================
// MAIN BOT EXECUTION
// ==========================================
async function runBot() {
  console.log("==================================================");
  console.log("  BOT AUTOMASI PENGISIAN INSTRUMEN (SEKUENSIAL PER USER)");
  console.log("==================================================");
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Pengaturan Jeda: 10 s/d 15 MENIT DITERAPKAN PER INDIVIDUAL USER.\n`);

  // Load questions
  let madelQ = [];
  let prelQ = [];
  try {
    madelQ = JSON.parse(fs.readFileSync(QUESTIONS_MADEL_PATH, 'utf8'));
    prelQ = JSON.parse(fs.readFileSync(QUESTIONS_PRELIM_PATH, 'utf8'));
  } catch (e) {
    console.error("Warning: File pertanyaan lokal tidak ditemukan, menggunakan kalkulasi generik.");
    madelQ = Array.from({ length: 30 }).map((_, i) => ({ id: i + 1, options: [{ score: 1 }, { score: 2 }, { score: 3 }, { score: 4 }, { score: 5 }] }));
    prelQ = Array.from({ length: 25 }).map((_, i) => ({ id: i + 1 }));
  }

  const b_madel = madelQ.map(() => (Math.random() * 2 - 1) * 0.5);

  const state = loadState();
  let totalTarget = DAILY_SCHEDULE.reduce((a, b) => a + b, 0);

  console.log(`Progress Terakhir: ${state.completedUsers}/${totalTarget} user telah terisi.\n`);

  for (let dayIdx = 0; dayIdx < DAILY_SCHEDULE.length; dayIdx++) {
    const quotaToday = DAILY_SCHEDULE[dayIdx];
    console.log(`\n==================================================`);
    console.log(`--- PERIODE HARI KE-${dayIdx + 1} (Target: ${quotaToday} user) ---`);
    console.log(`==================================================\n`);

    for (let u = 0; u < quotaToday; u++) {
      const userIndexGlobal = state.completedUsers + 1;
      if (userIndexGlobal > totalTarget) {
        console.log("🎉 Semua target 350 user telah selesai!");
        return;
      }

      const gender = Math.random() < 0.55 ? 'Perempuan' : 'Laki-Laki';
      const name = generateUniqueName(gender);
      const campus = CAMPUSES[Math.floor(Math.random() * CAMPUSES.length)];
      const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
      const specialNeeds = Math.random() < 0.95 ? 'tidak' : 'ya';

      // Ability latent theta (mean 0.3, SD 0.7 - realistic human range)
      const theta = randn_bm() * 0.7 + 0.3;

      console.log(`👤 [USER ${userIndexGlobal}/${totalTarget}] Memproses Responden SEORANG DIRI: ${name} (${gender}, ${campus})...`);

      try {
        // STEP 1: Registrasi Profil User
        const authRes = await sendPostRequest('/api/auth', {
          name,
          campus,
          gender,
          origin,
          specialNeeds
        });
        const userId = authRes.userId;
        console.log(`  ✓ 1/4 Registrasi Profil Berhasil (User ID: ${userId})`);

        // Jeda membaca & mengisi instrumen 1 (5 detik)
        await sleep(5000);

        // STEP 2: Pengisian PDI-DL
        let totalPrelim = 0;
        const prelimAnswers = prelQ.map((q) => {
          let pScore = Math.round(theta + 3.2 + (randn_bm() * 0.4));
          if (pScore > 5) pScore = 5;
          if (pScore < 1) pScore = 1;
          totalPrelim += pScore;
          return { questionId: q.id, score: pScore };
        });

        await sendPostRequest('/api/assessment', {
          userId,
          type: 'PDI-DL',
          totalScore: totalPrelim,
          answersJson: prelimAnswers
        });
        console.log(`  ✓ 2/4 Asesmen PDI-DL Terisi (Skor Total: ${totalPrelim})`);

        // Jeda membaca & mengisi instrumen 2 (8 detik)
        await sleep(8000);

        // STEP 3: Pengisian MADEL5C
        let totalMadel = 0;
        const madelAnswers = madelQ.map((q, idx) => {
          const scores = q.options ? q.options.map(o => o.score).sort((a, b) => a - b) : [1, 2, 3, 4, 5];
          const rawPos = theta - b_madel[idx] + (randn_bm() * 0.25);
          const p = normalCDF(rawPos);
          let scoreIdx = Math.floor(p * scores.length);
          if (scoreIdx >= scores.length) scoreIdx = scores.length - 1;
          if (scoreIdx < 0) scoreIdx = 0;
          const pickedScore = scores[scoreIdx];
          totalMadel += pickedScore;
          return { questionId: q.id, score: pickedScore };
        });

        await sendPostRequest('/api/assessment', {
          userId,
          type: 'MADEL5C',
          totalScore: totalMadel,
          answersJson: madelAnswers
        });
        console.log(`  ✓ 3/4 Asesmen MADEL5C Terisi (Skor Total: ${totalMadel})`);

        // Jeda membaca & mengisi instrumen 3 (8 detik)
        await sleep(8000);

        // STEP 4: Pengisian SUS (System Usability Scale)
        let susTotalRaw = 0;
        const susAnswers = Array.from({ length: 10 }).map((_, idx) => {
          const qNum = idx + 1;
          let raw = Math.round(theta * 0.5 + 4 + randn_bm() * 0.4);
          if (raw > 5) raw = 5;
          if (raw < 1) raw = 1;
          let finalScore = raw;
          if (qNum % 2 === 0) finalScore = 6 - raw; // Reverse coding for even items
          susTotalRaw += (qNum % 2 !== 0) ? (finalScore - 1) : (5 - finalScore);
          return { questionId: qNum, score: finalScore };
        });
        const susTotalScore = susTotalRaw * 2.5;
        const feedback = FEEDBACK_LIST[Math.floor(Math.random() * FEEDBACK_LIST.length)];

        await sendPostRequest('/api/survey', {
          userId,
          totalScore: susTotalScore,
          answersJson: susAnswers,
          feedback
        });
        console.log(`  ✓ 4/4 Survei SUS Terisi (Skor SUS: ${susTotalScore}, Feedback: "${feedback.substring(0, 30)}...")`);

        // Update & simpan state
        state.completedUsers++;
        state.users.push({ userId, name, gender, campus, totalMadel, totalPrelim, susTotalScore, timestamp: new Date().toISOString() });
        saveState(state);

        console.log(`  ✅ USER ${userIndexGlobal} (${name}) SELESAI PENGISIAN 3 INSTRUMEN.`);

        // JEDA ACAK 10-15 MENIT PER INDIVIDUAL USER
        if (state.completedUsers < totalTarget) {
          const delayMinutes = MIN_DELAY_MINUTES + Math.random() * (MAX_DELAY_MINUTES - MIN_DELAY_MINUTES);
          const delayMs = Math.round(delayMinutes * 60 * 1000);
          const nextTime = new Date(Date.now() + delayMs).toLocaleTimeString('id-ID');
          console.log(`  ⏳ ISTIRAHAT: Menunggu jeda ${delayMinutes.toFixed(2)} menit sebelum USER BERIKUTNYA (${userIndexGlobal + 1}) mulai pada pukul ${nextTime}...\n`);
          await sleep(delayMs);
        }

      } catch (err) {
        console.error(`  ❌ Gagal memproses user ${name}:`, err.message);
        console.log("  Mengulangi langkah untuk user berikutnya dalam 10 detik...");
        await sleep(10000);
      }
    }
  }

  console.log("\n==================================================");
  console.log(`🎉 SELAMAT! Seluruh 350 responden telah berhasil terisi secara berurutan.`);
  console.log("==================================================");
}

runBot().catch(console.error);
