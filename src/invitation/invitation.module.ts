import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';

@Module({
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
