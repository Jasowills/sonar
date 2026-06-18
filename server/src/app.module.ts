import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AlertsModule } from './alerts/alerts.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AppController } from './app.controller';
import type { Request } from 'express';
import { AuthModule } from './auth/auth.module';
import { extractBearerToken, verifyToken } from './auth/jwt';
import { GqlAuthGuard } from './auth/gql-auth.guard';
import { GqlThrottlerGuard } from './auth/gql-throttler.guard';
import { DeploymentsModule } from './deployments/deployments.module';
import { EmailModule } from './email/email.module';
import { EnvironmentsModule } from './environments/environments.module';
import { ErrorsModule } from './errors/errors.module';
import { EventsModule } from './events/events.module';
import { GraphQLModule } from '@nestjs/graphql';
import { IncidentsModule } from './incidents/incidents.module';
import { join } from 'node:path';
import { AppService } from './app.service';
import { MonitorsModule } from './monitors/monitors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OverviewModule } from './overview/overview.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ServicesModule } from './services/services.module';
import { MembersModule } from './members/members.module';
import { StatusPagesModule } from './status-pages/status-pages.module';
import { SystemModule } from './system/system.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    AuthModule,
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      introspection: process.env.NODE_ENV !== 'production',
      plugins: [],
      context: ({ req }: { req: Request & { ip?: string } }) => {
        const token = extractBearerToken(req.headers.authorization);
        const user = token ? verifyToken(token) : null;
        return { user, req };
      },
    }),
    AiModule,
    SystemModule,
    WorkspacesModule,
    ProjectsModule,
    AlertsModule,
    ApiKeysModule,
    EnvironmentsModule,
    IncidentsModule,
    ServicesModule,
    MonitorsModule,
    DeploymentsModule,
    ErrorsModule,
    CloudinaryModule,
    AnalyticsModule,
    EventsModule,
    EmailModule,
    NotificationsModule,
    OverviewModule,
    StatusPagesModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: GqlAuthGuard },
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
  ],
})
export class AppModule {}
