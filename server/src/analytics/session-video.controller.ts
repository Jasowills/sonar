import { Controller, Post, Req, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { ApiKeyGuard } from '../auth/api-key.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('ingest/session-video')
export class SessionVideoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const sessionKey = req.body?.sessionId as string | undefined;
    if (!sessionKey) {
      console.log('[session-video] missing sessionId in request body');
      return { ok: false, error: 'sessionId required' };
    }

    console.log(`[session-video] received ${file.size} bytes for session ${sessionKey}`);

    const url = await this.cloudinary.uploadVideo(file.buffer, {
      mimeType: file.mimetype,
      publicId: `session_${sessionKey}`,
    });

    if (url) {
      console.log(`[session-video] uploaded to cloudinary: ${url}`);
      const existing = await this.prisma.analyticsSession.findFirst({
        where: { sessionKey },
      });
      if (existing) {
        await this.prisma.analyticsSession.update({
          where: { id: existing.id },
          data: { videoUrl: url },
        });
        console.log(`[session-video] linked to session ${existing.id}`);
      } else {
        console.log(`[session-video] no session found for sessionKey ${sessionKey}`);
      }
    } else {
      console.log('[session-video] cloudinary upload returned null');
    }

    return { ok: !!url, url };
  }
}
