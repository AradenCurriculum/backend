import { InviteCode } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto implements Partial<InviteCode> {
  @IsString()
  @IsOptional()
  role?: string;
}
