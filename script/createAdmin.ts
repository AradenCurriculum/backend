import * as readline from 'node:readline/promises';
import { access, mkdir } from 'node:fs/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PrismaClient } from '@prisma/client';
import { MD5 } from 'crypto-js';

const prisma = new PrismaClient();

async function main() {
  const adminInfo = {
    username: '',
    password: '',
    email: '',
  };
  const readStream = readline.createInterface({ input, output });

  adminInfo.username = await readStream.question('请输入用户名：');
  adminInfo.password = await readStream.question('请输入密码：');
  adminInfo.email = await readStream.question('请输入电子邮件：');

  adminInfo.password = MD5(adminInfo.password).toString();

  readStream.close();

  const user = await prisma.user.create({
    data: {
      ...adminInfo,
      role: 'admin',
    },
  });

  try {
    await access('assets');
  } catch (error) {
    await mkdir('assets');
  }

  await mkdir(`assets/${user.id}`);

  console.log('创建管理员账户：', user);
}

main();
