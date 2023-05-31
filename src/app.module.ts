import { DynamicModule, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserModule } from './user/user.module';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [UserModule, InvitationModule],
})
export class AppModule {
  static registerGlobalService(config: {
    prisma: PrismaClient;
  }): DynamicModule {
    return {
      global: true,
      module: AppModule,
      providers: [{ provide: 'PrismaClient', useValue: config.prisma }],
      exports: ['PrismaClient'],
    };
  }
}
