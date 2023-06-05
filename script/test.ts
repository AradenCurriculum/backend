import { PrismaClient } from '@prisma/client';
import { access, mkdir } from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });
  for (const user of users) {
    try {
      await access(`assets/${user.id}`);
    } catch (err) {
      await mkdir(`assets/${user.id}`);
    }
  }
}

main();
