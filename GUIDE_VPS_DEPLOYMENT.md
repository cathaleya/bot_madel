# Panduan Teknis Deployment Platform HDAP di VPS (Ubuntu 22.04/24.04) - Metode Docker (Aman & Anti Ransomware)

Dokumen ini menjelaskan langkah-langkah sistematis untuk mendeploy aplikasi **Hybrid-Diagnostic Assessment Platform (HDAP)** ke server VPS Bapak secara aman menggunakan Docker dan Docker Compose.

---

## 1. Konsep Keamanan (Isolasi & Localhost Port Binding)
Untuk mencegah serangan ransomware, eksploitasi database, atau malware yang memindai port terbuka:
- Database **PostgreSQL** dan aplikasi **Next.js** berjalan di dalam kontainer terisolasi (Docker).
- Port PostgreSQL (`5432`) dan port Next.js (`3000`) **TIDAK dibind ke `0.0.0.0` (IP Publik)**.
- Port-port tersebut **hanya dibind ke `127.0.0.1` (localhost)** di dalam VPS.
- Akses ke sistem dari luar dilakukan menggunakan **Reverse Proxy (Nginx + HTTPS)** untuk publik, atau lewat **SSH Tunneling** untuk keperluan administrasi database/uji coba lokal.

---

## 2. Persiapan Awal di VPS
Masuk ke VPS melalui SSH (Gunakan Terminal atau PowerShell):
```bash
ssh root@IP_ADDRESS_VPS_BAPAK
```

### A. Update Sistem & Security Tools
```bash
sudo apt update && sudo apt upgrade -y

# Install Firewall (UFW) dan Fail2ban (Anti-Brute Force SSH)
sudo apt install ufw fail2ban -y

# Konfigurasi Firewall Dasar
sudo ufw allow 22    # Port SSH
sudo ufw allow 80    # Port HTTP
sudo ufw allow 443   # Port HTTPS
sudo ufw enable
```

### B. Konfigurasi Fail2ban
Pastikan Fail2ban berjalan untuk melindungi dari serangan brute force SSH:
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

---

## 3. Instalasi Docker & Docker Compose
Hapus kebutuhan menginstal Node.js dan PostgreSQL secara manual di OS VPS utama. Cukup instal Docker:
```bash
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl enable --now docker
```

---

## 4. Deployment Aplikasi

### A. Clone Repository
Pastikan Anda masuk ke folder `/var/www`, lalu lakukan clone repository:
```bash
cd /var/www
# Jika git belum terinstall: sudo apt install git -y
sudo git clone https://github.com/cathaleya/web_e-assesment.git web_e-assesment
cd web_e-assesment
```
*(Atau arahkan ke folder versi deployment VPS Anda)*

### B. Konfigurasi Environment (`.env`)
Salin template konfigurasi lingkungan:
```bash
cp .env.example .env
sudo nano .env
```
Isi dan sesuaikan konfigurasi. Gunakan password database yang aman:
```env
# Database (PostgreSQL di dalam Docker container)
DB_PASSWORD=GantiDenganPasswordYangSangatAman123!
DATABASE_URL="postgresql://postgres:GantiDenganPasswordYangSangatAman123!@db:5432/hdap?schema=public"

# Kredensial Admin Panel
ADMIN_USERNAME=admin.hdap
ADMIN_PASSWORD=GantiPasswordAdminBapak21!

# Google Gemini API Key
GEMINI_API_KEY="AIzaSyA98EOZqgSeWh9dAoqrDuhb8WOKC6Om-0g"

# URL aplikasi
NEXT_PUBLIC_APP_URL=https://domain-bapak.com

NODE_ENV=production
```
*Tekan `Ctrl+O`, `Enter`, lalu `Ctrl+X` untuk simpan.*


### C. Build & Jalankan Docker Container
Jalankan Docker Compose untuk mengunduh database PostgreSQL, membuild aplikasi Next.js, dan menjalankannya di background:
```bash
docker compose up -d --build
```
Untuk memantau log aplikasi guna memastikan koneksi database sukses:
```bash
docker compose logs -f
```


---

## 5. Cara Mengakses Aplikasi & Database Dari Luar VPS

### Cara A: Menggunakan SSH Tunneling (Akses Lokal/Administrasi)
Karena semua port dibind ke localhost (`127.0.0.1`), port tersebut aman dari scan luar. Untuk mengaksesnya dari laptop pribadi Anda:

1. Buka **Command Prompt (CMD)** baru di laptop Anda.
2. Jalankan perintah tunneling ini:
   ```cmd
   ssh -L 3000:127.0.0.1:3000 -L 5432:127.0.0.1:5432 root@IP_ADDRESS_VPS_BAPAK
   ```
3. Biarkan jendela CMD tersebut terbuka. Sekarang Anda bisa mengakses:
   * **Aplikasi Web**: Buka browser ke [http://localhost:3000](http://localhost:3000)
   * **Database**: Hubungkan aplikasi pgAdmin/DBeaver di laptop Anda ke `localhost:5432`.

---

### Cara B: Menggunakan Nginx Reverse Proxy (Untuk Publik & SSL)
Untuk mempublikasikan aplikasi agar bisa diakses oleh pengguna umum menggunakan nama domain Anda secara aman (HTTPS):

1. **Install Nginx** di OS utama VPS:
   ```bash
   sudo apt install nginx -y
   ```
2. **Buat File Konfigurasi Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/hdap
   ```
3. Masukkan konfigurasi reverse proxy berikut:
   ```nginx
   server {
       listen 80;
       server_name domain-bapak.com www.domain-bapak.com;

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
4. **Aktifkan Konfigurasi & Reload Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hdap /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
5. **Pasang SSL Gratis (HTTPS) dengan Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
   ```bash
   sudo certbot --nginx -d domain-bapak.com -d www.domain-bapak.com
   ```
   *(Pilih opsi `Redirect` saat ditanya untuk otomatis mengarahkan HTTP ke HTTPS).*

---

## 6. Cara Melakukan Update Aplikasi di VPS
Jika Bapak melakukan perubahan kode di laptop lokal dan telah mem-push-nya ke GitHub, jalankan perintah ini di VPS untuk mengupdate aplikasi:

```bash
cd /var/www/web_e-assesment

# 1. Tarik kode terbaru dari GitHub
git pull origin main

# 2. Rebuild dan restart container tanpa downtime yang lama
docker compose up -d --build
```

---

## 7. Penanganan Pasca-Abuse (Deteksi Malware)
Jika VPS Bapak pernah terkena malware sebelumnya, pastikan sistem bersih dengan langkah berikut:

1. **Cek Penggunaan CPU:**
   ```bash
   top
   # Tekan 'q' untuk keluar. Waspadai proses mencurigakan dengan CPU 100% (seperti 'xmrig', 'miner').
   ```
2. **Hapus File Malware (Jika ada di folder tmp):**
   ```bash
   sudo rm -rf /tmp/xmrig*
   sudo rm -rf /var/tmp/scanner*
   ```

---
*Dokumen ini merupakan bagian dari panduan implementasi teknologi Riset BIMA S3.*
masuk folder di vps:

cd /var/www/web_e-assesment

docker compose down -v

docker compose up -d --build

reset data:

docker exec -it hdap-db psql -U postgres -d hdap -c 'TRUNCATE TABLE "Assessment", "Survey", "User" RESTART IDENTITY CASCADE;'


# 1. Masuk ke folder project di VPS
cd /var/www/web_e-assesment
# 2. Reset total database (Menghapus container & volume database lama)
docker compose down -v
docker compose up -d --build
# 3. Bersihkan seluruh file grafik/cache analisis lama
rm -rf public/analysis/outputs/*
