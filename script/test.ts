import { PrismaClient } from '@prisma/client';
import { mkdir } from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });
  for (const user of users) {
    await mkdir(`assets/${user.id}`);
  }
}

main();
