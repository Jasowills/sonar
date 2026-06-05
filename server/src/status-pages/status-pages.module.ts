import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StatusPagesController } from './status-pages.controller';
import { StatusPagesResolver } from './status-pages.resolver';
import { StatusPagesService } from './status-pages.service';

@Module({
  imports: [PrismaModule],
  controllers: [StatusPagesController],
  providers: [StatusPagesResolver, StatusPagesService],
  exports: [StatusPagesService],
})
export class StatusPagesModule {}
