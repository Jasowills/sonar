import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { StatusPagesService } from './status-pages.service';

@Controller('status')
export class StatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Public()
  @Get(':workspaceSlug/:slug')
  async getStatusPage(
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('slug') slug: string,
  ) {
    const data = await this.statusPagesService.getPublicPageData(
      workspaceSlug,
      slug,
    );
    if (!data) throw new NotFoundException('Status page not found');

    return data;
  }
}
