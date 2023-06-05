import { readFile, writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function LoggerMiddleware(req: any, res: any, next: any) {
  const filename = `${new Date().toLocaleDateString().replace(/\//g, '-')}.log`;

  const info = `${new Date().toLocaleTimeString()} / ${req.method} : ${
    req.originalUrl
  } - ${res.statusCode} ${res.statusMessage} ip: ${req.ip}
  用户信息: ${JSON.stringify(req.session.user)} \n
`;

  await writeFile(`logs/${filename}`, info, { flag: 'a' });

  const file = await readFile(`logs/${filename}`);

  await prisma.log.upsert({
    where: { filename },
    update: {
      size: file.byteLength,
      updated: new Date(),
    },
    create: {
      filename,
      size: file.byteLength,
      updated: new Date(),
    },
  });

  next();
}
