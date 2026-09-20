const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.create({
    data: {
      email: 'ruslinairianty7@gmail.com', // Ganti dengan email Bapak
      username: 'Admin BIMA',
      passwordHash: 'Faithbless21', // Ini password Bapak
      role: 'ADMIN',
    },
  });
  console.log('Admin Berhasil Dibuat:', admin.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
