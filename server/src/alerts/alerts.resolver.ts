import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
  CreateAlertChannelInput,
  CreateAlertRuleInput,
  UpdateAlertChannelInput,
  UpdateAlertRuleInput,
} from './alerts.inputs';
import { AlertChannelModel } from './models/alert-channel.model';
import { AlertRuleModel } from './models/alert-rule.model';
import { AlertsService } from './alerts.service';

@Resolver()
export class AlertsResolver {
  constructor(private readonly alertsService: AlertsService) {}

  @Query(() => [AlertChannelModel])
  alertChannels(): Promise<AlertChannelModel[]> {
    return this.alertsService.findAllChannels();
  }

  @Query(() => [AlertRuleModel])
  alertRules(): Promise<AlertRuleModel[]> {
    return this.alertsService.findAllRules();
  }

  @Mutation(() => AlertChannelModel)
  createAlertChannel(
    @Args('input') input: CreateAlertChannelInput,
  ): Promise<AlertChannelModel> {
    return this.alertsService.createChannel(input);
  }

  @Mutation(() => AlertChannelModel)
  updateAlertChannel(
    @Args('input') input: UpdateAlertChannelInput,
  ): Promise<AlertChannelModel> {
    return this.alertsService.updateChannel(input);
  }

  @Mutation(() => AlertChannelModel)
  deleteAlertChannel(
    @Args('id') id: string,
  ): Promise<AlertChannelModel> {
    return this.alertsService.deleteChannel(id);
  }

  @Mutation(() => AlertRuleModel)
  createAlertRule(
    @Args('input') input: CreateAlertRuleInput,
  ): Promise<AlertRuleModel> {
    return this.alertsService.createRule(input);
  }

  @Mutation(() => AlertRuleModel)
  updateAlertRule(
    @Args('input') input: UpdateAlertRuleInput,
  ): Promise<AlertRuleModel> {
    return this.alertsService.updateRule(input);
  }

  @Mutation(() => AlertRuleModel)
  deleteAlertRule(
    @Args('id') id: string,
  ): Promise<AlertRuleModel> {
    return this.alertsService.deleteRule(id);
  }
}
