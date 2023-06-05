import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import * as session from 'express-session';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/httpException.filter';
import { LoggerMiddleware } from './common/logger.middleware';
import { access, mkdir } from 'node:fs/promises';

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

  try {
    await access('logs');
  } catch (error) {
    await mkdir('logs');
  }

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(LoggerMiddleware);

  await app.listen(3000);
}
bootstrap();
