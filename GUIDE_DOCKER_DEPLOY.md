# Panduan Deployment Aman Menggunakan Docker Compose (Anti Ransomware)

Panduan ini menjelaskan cara melakukan instalasi, deployment, dan pengaksesan aplikasi menggunakan Docker Compose secara aman.

---

## 1. Konsep Keamanan (Isolasi & Localhost Port Binding)
Untuk mencegah serangan luar (seperti Ransomware atau percobaan brute-force database):
- Port PostgreSQL (`5432`) dan port Next.js (`3000`) **TIDAK dibind ke `0.0.0.0` (IP Publik)**.
- Port-port tersebut **hanya dibind ke `127.0.0.1` (localhost)** di dalam VPS.
- Dari luar internet, tidak ada port database atau port aplikasi yang langsung terbuka ke publik.

---

## 2. Prasyarat di VPS
Pastikan VPS Anda sudah terinstal Docker dan Docker Compose. Jika belum, jalankan perintah ini di VPS:
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose -y

# Jalankan service docker
sudo systemctl enable --now docker
```

---

## 3. Langkah-Langkah Deployment

### Langkah 1: Persiapan Folder & Kode di VPS
1. Masuk ke VPS via SSH.
2. Pastikan Anda berada di folder deployment proyek:
   ```bash
   cd /var/www/web_e-assesment
   ```

### Langkah 2: Konfigurasi Environment File (`.env`)
1. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit file `.env` untuk mengganti password database dan konfigurasi lainnya:
   ```bash
   nano .env
   ```
   *Sesuaikan `DB_PASSWORD` dan ubah `DATABASE_URL` jika password diubah.*

### Langkah 3: Menjalankan Aplikasi dengan Docker Compose
Jalankan perintah berikut untuk membuild container dan menjalankannya di background:
```bash
docker-compose up -d --build
```

### Langkah 4: Memantau Log Container
Untuk memastikan semuanya berjalan lancar dan database terhubung:
```bash
docker-compose logs -f
```

---

## 4. Cara Mengakses Aplikasi & Database Dari Luar VPS

Karena port di VPS di-bind ke localhost (`127.0.0.1`), Anda tidak bisa membuka `http://IP_VPS:3000` secara langsung di browser Anda. Ada 2 cara untuk mengaksesnya:

### Cara A: Menggunakan SSH Tunneling (Untuk Kebutuhan Admin/Akses Lokal)
Anda dapat memetakan port di VPS ke port lokal di laptop Anda menggunakan command prompt (CMD) di laptop Windows Anda:

1. Buka CMD baru di laptop Anda (bukan di dalam VPS).
2. Jalankan perintah SSH Tunneling ini:
   ```cmd
   ssh -L 3000:127.0.0.1:3000 -L 5432:127.0.0.1:5432 root@IP_VPS_ANDA
   ```
3. Biarkan jendela CMD tersebut tetap terbuka.
4. Sekarang, buka browser di laptop Anda dan akses:
   * Aplikasi: [http://localhost:3000](http://localhost:3000)
   * Database: Anda bisa hubungkan aplikasi client database (seperti DBeaver atau pgAdmin) ke `localhost:5432`.

---

### Cara B: Menggunakan Nginx Reverse Proxy (Untuk Produksi & Publik)
Jika aplikasi ingin diakses oleh user umum via domain/subdomain dengan SSL (HTTPS), gunakan Nginx di VPS Anda sebagai perantara (Reverse Proxy):

1. Install Nginx di VPS:
   ```bash
   sudo apt install nginx -y
   ```
2. Buat file konfigurasi Nginx baru:
   ```bash
   sudo nano /etc/nginx/sites-available/hdap
   ```
3. Masukkan konfigurasi berikut:
   ```nginx
   server {
       listen 80;
       server_name domainanda.com; # Ganti dengan domain/subdomain Anda

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Aktifkan konfigurasi dan restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hdap /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
5. Install SSL gratis (Certbot) untuk mengamankan trafik dengan HTTPS:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
   ```bash
   sudo certbot --nginx -d domainanda.com
   ```
