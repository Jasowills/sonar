import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { EmailService } from '../email/email.service';

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  workspaceId: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly email: EmailService,
  ) {}

  async findAll(
    userId: string,
    workspaceId?: string,
    limit = 20,
  ): Promise<NotificationRecord[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId, ...(workspaceId ? { workspaceId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return notifications;
    } catch {
      return [];
    }
  }

  async unreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: { userId, read: false },
      });
    } catch {
      return 0;
    }
  }

  async markRead(id: string): Promise<boolean> {
    try {
      await this.prisma.notification.update({
        where: { id },
        data: { read: true, updatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async markAllRead(userId: string): Promise<boolean> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true, updatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async create(data: {
    type: string;
    title: string;
    body?: string;
    link?: string;
    userId: string;
    workspaceId: string;
  }): Promise<NotificationRecord> {
    const now = new Date();
    const record = await this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        link: data.link ?? null,
        userId: data.userId,
        workspaceId: data.workspaceId,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Push real-time via SSE
    this.events.emit({
      type: 'notification',
      data: {
        id: record.id,
        type: record.type,
        title: record.title,
        body: record.body,
        link: record.link,
        createdAt: record.createdAt.toISOString(),
      },
      userId: data.userId,
      workspaceId: data.workspaceId,
    });

    // Send email if notification is relevant (monitor_down, incident_created, alert_fired)
    if (['monitor_down', 'incident_created', 'alert_fired'].includes(data.type)) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (user?.email) {
        await this.email.send(
          user.email,
          `[Watchdog] ${data.title}`,
          `<p>${data.body ?? data.title}</p><p><a href="${process.env.CLIENT_URL ?? 'http://localhost:3000'}${data.link ?? ''}">View in Watchdog</a></p>`,
        );
      }
    }

    return record;
  }
}
