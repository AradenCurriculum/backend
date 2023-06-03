import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contact = await prisma.contact.create({
    data: {
      fromId: '98b15f01-5f92-49e5-b119-149706347825',
      toId: '8ec13b15-b938-44a6-8659-223da952da45',
      status: 'pending',
    },
  });
  console.log('创建好友申请：', contact);
}

main();
