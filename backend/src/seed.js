const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@pontobom.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@pontobom.com',
      senha: senhaHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin criado:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
