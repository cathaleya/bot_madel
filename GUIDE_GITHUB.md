# Panduan Push Project HDAP ke GitHub Secara Aman

Dokumen ini berisi langkah-langkah untuk mengunggah project HDAP dari folder `deploy` ke GitHub agar bisa dideploy ke VPS Bapak.

## 1. Persiapan di GitHub
1. Buka [GitHub](https://github.com/) dan login.
2. Klik tombol **New Repository**.
3. Beri nama repositori (contoh: `hdap-core-v1`).
4. **PENTING:** Pilih **Private** agar data riset Bapak tidak bisa dilihat orang lain.
5. Klik **Create repository**.

## 2. Inisialisasi Git di Komputer Lokal
Buka Terminal/PowerShell di dalam folder `d:/Riset_BIMA/vps_version/deploy`, lalu jalankan perintah berikut:

```bash
# Inisialisasi folder sebagai repositori git
git init

# Menambahkan semua file ke dalam antrian (Staging)
# (File .env akan otomatis diabaikan sesuai aturan .gitignore)
git add .

# Membuat catatan perubahan pertama
git commit -m "Initial commit: Migrasi HDAP ke Next.js (Secure Version)"

# Menghubungkan ke GitHub Bapak (Ganti USERNAME dengan akun Bapak)
git remote add origin https://github.com/USERNAME/hdap-core-v1.git

# Mengunggah kode ke GitHub
git branch -M main
git push -u origin main
```

## 3. Catatan Penting Keamanan
> [!CAUTION]
> **JANGAN PERNAH** menghapus baris `.env` dari file `.gitignore`. 
> Kunci API Gemini dan Password Database Bapak hanya boleh ada di server VPS, tidak boleh masuk ke server GitHub meskipun repositorinya bersifat Private.

## 4. Cara Update di Masa Depan
Setiap kali ada perubahan visual atau fitur yang Bapak lakukan, cukup jalankan:
```bash
git add .
git commit -m "Deskripsi perubahan Bapak di sini"
git push origin main
```

## 5. Deployment di VPS (Ringkasan)
Setelah kode ada di GitHub, di dalam VPS Bapak tinggal menjalankan:
1. `cd /var/www/web_e-assesment` (Masuk ke folder deployment di VPS)
2. `git pull origin main` (Untuk menarik kode terbaru)
3. `docker compose up -d --build` (Membangun ulang dan menjalankan container baru)

---
*Dibuat khusus untuk Riset BIMA - Hybrid Diagnostic Assessment Platform.*
