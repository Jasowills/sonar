import { Controller, Get, Logger, Query, Redirect, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WebClient } from '@slack/web-api';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

@Controller('integrations')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('slack/connect')
  @Redirect()
  connect(@Query('workspaceId') workspaceId: string) {
    const clientId = process.env.SLACK_CLIENT_ID!;
    const redirectUri = process.env.SLACK_REDIRECT_URI!;
    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=incoming-webhook,chat:write,channels:read&redirect_uri=${redirectUri}&state=${workspaceId}`;
    return { url, statusCode: 302 };
  }

  @Public()
  @Get('slack/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') workspaceId: string,
    @Res() res: Response,
  ) {
    try {
      const client = new WebClient();
      const response = await client.oauth.v2.access({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      });

      const accessToken = response.access_token as string;
      const teamName = ((response.team as { name?: string })?.name) ?? 'Slack';
      const channelId = (response.incoming_webhook as { channel_id?: string })?.channel_id;
      const webhookUrl = (response.incoming_webhook as { url?: string })?.url;

      const destination = webhookUrl ?? channelId ?? 'general';
      const channelName = teamName;

      await this.prisma.alertChannel.create({
        data: {
          name: channelName,
          type: 'SLACK',
          destination,
          secretRef: accessToken,
          isEnabled: true,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.send(
        `<html><body><h1>Slack connected!</h1><p>Channel "${channelName}" added. You can close this tab.</p></body></html>`,
      );
    } catch (err) {
      this.logger.error('Slack OAuth callback failed', err);
      res
        .status(500)
        .send(
          `<html><body><h1>OAuth failed</h1><p>Please try again.</p></body></html>`,
        );
    }
  }
}
