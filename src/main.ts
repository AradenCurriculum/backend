import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import * as session from 'express-session';

import { AppModule } from './app.module';

const prisma = new PrismaClient();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule.registerGlobalService({ prisma }),
  );

  app.use(
    session({
      secret: "Araden's NetDisk",
      rolling: true, // 在每次请求时强行设置 cookie，这将重置 cookie 过期时间(默认:false)
      cookie: { maxAge: null }, // 以 cookie 形式保存在客户端的 session 票据的配置项
    }),
  );

  await app.listen(3000);
}
bootstrap();
