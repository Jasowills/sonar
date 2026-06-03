import { Module } from '@nestjs/common';
import { MembersResolver } from './members.resolver';
import { MembersService } from './members.service';

@Module({
  providers: [MembersResolver, MembersService],
  exports: [MembersService],
})
export class MembersModule {}
