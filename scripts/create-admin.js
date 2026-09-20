const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script untuk membuat akun Admin pertama pada platform HDAP.
 * Jalankan dengan perintah: node scripts/create-admin.js
 */

async function main() {
  console.log('--- Memulai Proses Pembuatan Admin ---');
  
  // Ganti data di bawah ini sesuai kebutuhan Bapak
  const adminData = {
    email: 'admin@madel5c.com',
    username: 'Admin BIMA',
    passwordHash: 'Faithbless21', // Di produksi, sebaiknya gunakan bcrypt untuk hashing
    role: 'ADMIN',
    institution: 'Universitas Riset BIMA',
  };

  try {
    const admin = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {
        role: 'ADMIN',
        username: adminData.username
      },
      create: adminData,
    });
    
    console.log('✅ SUKSES: Akun Admin berhasil dikonfigurasi.');
    console.log('📧 Email    :', admin.email);
    console.log('🔑 Role     :', admin.role);
    console.log('--------------------------------------');
    console.log('Silakan login di https://madel5c.com/login');
  } catch (error) {
    console.error('❌ GAGAL: Terjadi kesalahan saat membuat admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
