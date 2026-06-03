import { Injectable, Logger } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(channelId: string, message: string): Promise<void> {
    try {
      const channel = await this.prisma.alertChannel.findUnique({
        where: { id: channelId },
      });
      if (!channel || !channel.isEnabled) return;

      switch (channel.type) {
        case 'SLACK':
          await this.sendSlack(channel.destination, channel.secretRef!, message);
          break;
        case 'WEBHOOK':
          await this.sendWebhook(channel.destination, message);
          break;
        case 'EMAIL':
          this.logger.log(`Email alert to ${channel.destination}: ${message}`);
          break;
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch alert to channel ${channelId}`, err);
    }
  }

  private async sendSlack(token: string, channel: string, message: string): Promise<void> {
    const client = new WebClient(token);
    await client.chat.postMessage({ channel, text: message });
  }

  private async sendWebhook(url: string, message: string): Promise<void> {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  }
}
