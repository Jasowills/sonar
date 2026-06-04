import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../shared/prisma-errors';
import { DeploymentModel, DeploymentStatus } from './models/deployment.model';
import { RecordDeploymentInput } from './deployments.inputs';

const DEPLOYMENT_STATUSES = [
  'IN_PROGRESS',
  'SUCCEEDED',
  'FAILED',
  'ROLLED_BACK',
] as const;

/** Minimum shape needed to render a deployment as a flat view model. */
type DeploymentViewSource = {
  id: string;
  version: string;
  status: string;
  description: string | null;
  deployedBy: string | null;
  deployedAt: Date;
  environment: { name: string };
  service: { name: string } | null;
};

type FindParams = {
  environmentKey?: string;
  projectSlug?: string;
  limit?: number;
};

@Injectable()
export class DeploymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindParams): Promise<DeploymentModel[]> {
    const limit = params.limit ?? 20;

    try {
      const environmentWhere: Prisma.EnvironmentWhereInput = {};
      if (params.environmentKey) {
        environmentWhere.key = params.environmentKey;
      }
      if (params.projectSlug) {
        environmentWhere.project = { slug: params.projectSlug };
      }

      const deployments = await this.prisma.deployment.findMany({
        where:
          Object.keys(environmentWhere).length > 0
            ? { environment: environmentWhere }
            : {},
        include: { environment: true, service: true },
        orderBy: { deployedAt: 'desc' },
        take: limit,
      });

      if (deployments.length > 0) {
        return deployments.map((deployment) => this.toView(deployment));
      }
    } catch {
      // noop
    }

    return [];
  }

  async record(input: RecordDeploymentInput, projectId?: string): Promise<DeploymentModel> {
    let environmentId = input.environmentId;
    if (!environmentId && input.environmentKey) {
      if (projectId) {
        const env = await this.prisma.environment
          .findFirst({
            where: { key: input.environmentKey, projectId },
            select: { id: true },
          })
          .catch(() => null);
        if (env) {
          environmentId = env.id;
        }
      } else if (input.projectKey) {
        const project = await this.prisma.project
          .findFirst({
            where: { slug: input.projectKey },
            select: { id: true },
          })
          .catch(() => null);
        if (project) {
          const env = await this.prisma.environment
            .findFirst({
              where: { key: input.environmentKey, projectId: project.id },
              select: { id: true },
            })
            .catch(() => null);
          if (env) {
            environmentId = env.id;
          }
        }
      }
    }

    if (!environmentId) {
      throw new HttpException(
        'environmentId (or environmentKey + valid API key) is required',
        400,
      );
    }

    try {
      const now = new Date();

      const deployment = await this.prisma.deployment.create({
        data: {
          environmentId,
          serviceId: input.serviceId ?? null,
          version: input.version,
          status: this.normalizeStatus(input.status),
          description: input.description,
          deployedBy: input.deployedBy,
          deployedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        include: { environment: true, service: true },
      });

      return this.toView(deployment);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  private normalizeStatus(status?: string | null): DeploymentStatus {
    return DEPLOYMENT_STATUSES.includes(
      status as (typeof DEPLOYMENT_STATUSES)[number],
    )
      ? (status as DeploymentStatus)
      : DeploymentStatus.SUCCEEDED;
  }

  private toView(deployment: DeploymentViewSource): DeploymentModel {
    return {
      id: deployment.id,
      version: deployment.version,
      status: this.normalizeStatus(deployment.status),
      description: deployment.description,
      deployedBy: deployment.deployedBy,
      deployedAt: deployment.deployedAt,
      environmentName: deployment.environment.name,
      serviceName: deployment.service?.name ?? null,
    };
  }
}
