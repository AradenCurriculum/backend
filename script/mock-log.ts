import { readFile, writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  for (let i = 1; i < 6; i++) {
    for (let j = 1; j <= 28; j++) {
      const filename = `2023-${i}-${j}.log`;
      await writeFile(`logs/${filename}`, 'test', { flag: 'a+' });
      const file = await readFile(`logs/${filename}`);
      const log = await prisma.log.upsert({
        where: {
          filename,
        },
        update: {
          size: file.byteLength,
          updated: new Date(`2023-${i}-${j}`),
        },
        create: {
          filename,
          size: file.byteLength,
          updated: new Date(`2023-${i}-${j}`),
        },
      });
      console.log(`upsert log: ${log.filename} size: ${log.size}`);
    }
  }
}

main();
