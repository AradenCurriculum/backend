import { DynamicModule, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserModule } from './user/user.module';
import { InvitationModule } from './invitation/invitation.module';
import { ContactModule } from './contact/contact.module';
import { LogModule } from './log/log.module';
import { FileModule } from './file/file.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [UserModule, InvitationModule, ContactModule, LogModule, FileModule, ShareModule],
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
