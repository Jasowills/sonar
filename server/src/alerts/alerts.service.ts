import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../shared/prisma-errors';
import {
  CreateAlertChannelInput,
  CreateAlertRuleInput,
  UpdateAlertChannelInput,
  UpdateAlertRuleInput,
} from './alerts.inputs';
import { AlertChannelModel } from './models/alert-channel.model';
import { AlertRuleModel } from './models/alert-rule.model';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllChannels(): Promise<AlertChannelModel[]> {
    try {
      const channels = await this.prisma.alertChannel.findMany();
      return channels;
    } catch {
      return [];
    }
  }

  async findAllRules(): Promise<AlertRuleModel[]> {
    try {
      const rules = await this.prisma.alertRule.findMany();
      return rules;
    } catch {
      return [];
    }
  }

  async createChannel(input: CreateAlertChannelInput): Promise<AlertChannelModel> {
    try {
      const now = new Date();
      return await this.prisma.alertChannel.create({
        data: {
          name: input.name,
          type: input.type,
          destination: input.destination,
          secretRef: input.secretRef ?? null,
          isEnabled: true,
          workspaceId: input.workspaceId,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async updateChannel(input: UpdateAlertChannelInput): Promise<AlertChannelModel> {
    try {
      return await this.prisma.alertChannel.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.destination !== undefined && { destination: input.destination }),
          ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async deleteChannel(id: string): Promise<AlertChannelModel> {
    try {
      return await this.prisma.alertChannel.delete({
        where: { id },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async createRule(input: CreateAlertRuleInput): Promise<AlertRuleModel> {
    try {
      const now = new Date();
      return await this.prisma.alertRule.create({
        data: {
          name: input.name,
          triggerType: input.triggerType,
          minimumSeverity: input.minimumSeverity ?? null,
          isEnabled: true,
          workspaceId: input.workspaceId,
          alertChannelId: input.alertChannelId,
          projectId: input.projectId ?? null,
          environmentId: input.environmentId ?? null,
          serviceId: input.serviceId ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async updateRule(input: UpdateAlertRuleInput): Promise<AlertRuleModel> {
    try {
      return await this.prisma.alertRule.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.triggerType !== undefined && { triggerType: input.triggerType }),
          ...(input.minimumSeverity !== undefined && { minimumSeverity: input.minimumSeverity }),
          ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
          ...(input.alertChannelId !== undefined && { alertChannelId: input.alertChannelId }),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async deleteRule(id: string): Promise<AlertRuleModel> {
    try {
      return await this.prisma.alertRule.delete({
        where: { id },
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }
}
