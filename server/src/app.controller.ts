import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Post,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppService } from './app.service';
import { ApiKeysService } from './api-keys/api-keys.service';
import { extractBearerToken, issueToken, verifyToken } from './auth/jwt';
import { Public } from './auth/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Public()
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }

  @Public()
  @Post('auth/google')
  async authGoogle(@Body() body: { code: string; redirectUri: string }) {
    const { code, redirectUri } = body;
    if (!code) {
      throw new HttpException('Missing authorization code', 400);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new HttpException(
        'Google OAuth is not configured on the server',
        500,
      );
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new HttpException('Failed to exchange authorization code', 400);
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
    };

    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { authorization: `Bearer ${tokens.access_token}` },
      },
    );

    if (!userRes.ok) {
      throw new HttpException('Failed to fetch user info', 400);
    }

    const googleUser = (await userRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Upsert user in database
    let user = await this.prisma.user
      .findUnique({ where: { authUserId: googleUser.id } })
      .catch(() => null);

    if (!user) {
      user = await this.prisma.user
        .findUnique({ where: { email: googleUser.email } })
        .catch(() => null);
    }

    const now = new Date();

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          authUserId: googleUser.id,
          fullName: googleUser.name || user.fullName,
          avatarUrl: googleUser.picture || user.avatarUrl,
          updatedAt: now,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          authUserId: googleUser.id,
          email: googleUser.email,
          fullName: googleUser.name || null,
          avatarUrl: googleUser.picture || null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // Ensure user has at least one workspace
    const membership = await this.prisma.membership
      .findFirst({ where: { userId: user.id } })
      .catch(() => null);

    if (!membership) {
      const slug = `default-${user.id.slice(-8)}`;
      const workspace = await this.prisma.workspace.create({
        data: {
          name: 'My Workspace',
          slug,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.prisma.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'owner',
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return {
      token: issueToken({
        sub: user.id,
        email: user.email,
        name: user.fullName,
        picture: user.avatarUrl,
      }),
    };
  }

  @Public()
  @Get('auth/verify-key')
  async verifyKey(@Headers('authorization') authorization?: string) {
    const key = extractBearerToken(authorization);
    if (!key) return { valid: false, reason: 'no key provided' };
    const projectId = await this.apiKeysService.resolve(key);
    if (!projectId) return { valid: false, reason: 'key not found or revoked' };
    return { valid: true, projectId };
  }

  @Public()
  @Post('auth/register')
  async register(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    const { email, password, name } = body;
    if (!email || !password) {
      throw new HttpException('Email and password are required', 400);
    }

    if (password.length < 8) {
      throw new HttpException('Password must be at least 8 characters', 400);
    }
    if (!/[A-Z]/.test(password)) {
      throw new HttpException('Password must contain an uppercase letter', 400);
    }
    if (!/[a-z]/.test(password)) {
      throw new HttpException('Password must contain a lowercase letter', 400);
    }
    if (!/[0-9]/.test(password)) {
      throw new HttpException('Password must contain a number', 400);
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpException('Registration failed. Please check your details and try again.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        authUserId: `email:${email}`,
        email,
        fullName: name || null,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create default workspace
    const slug = `default-${user.id.slice(-8)}`;
    const workspace = await this.prisma.workspace.create({
      data: {
        name: 'My Workspace',
        slug,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'owner',
        createdAt: now,
        updatedAt: now,
      },
    });

    return {
      token: issueToken({
        sub: user.id,
        email: user.email,
        name: user.fullName,
        picture: null,
      }),
    };
  }

  @Public()
  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) {
      throw new HttpException('Email and password are required', 400);
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new HttpException('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpException('Invalid email or password', 401);
    }

    return {
      token: issueToken({
        sub: user.id,
        email: user.email,
        name: user.fullName,
        picture: null,
      }),
    };
  }

  @Delete('auth/account')
  async deleteAccount(@Headers('authorization') authorization?: string) {
    const token = extractBearerToken(authorization);
    if (!token) {
      throw new HttpException('Unauthorized', 401);
    }

    const authedUser = verifyToken(token);
    if (!authedUser) {
      throw new HttpException('Invalid or expired token', 401);
    }

    const userId = authedUser.sub;

    // Collect all workspace IDs the user belongs to
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
    });

    const workspaceIds = memberships.map((m) => m.workspaceId);

    if (workspaceIds.length === 0) {
      // No workspaces — just delete the user and return
      await this.prisma.user.delete({ where: { id: userId } });
      return { success: true };
    }

    // ── Gather all IDs that cascade from workspaces ──────────────────────
    const projects = await this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    const environments = await this.prisma.environment.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true },
    });
    const environmentIds = environments.map((e) => e.id);

    const services = await this.prisma.service.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true },
    });
    const serviceIds = services.map((s) => s.id);

    const monitors = await this.prisma.monitor.findMany({
      where: { environmentId: { in: environmentIds } },
      select: { id: true },
    });
    const monitorIds = monitors.map((m) => m.id);

    const errorGroups = await this.prisma.errorGroup.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true },
    });
    const errorGroupIds = errorGroups.map((g) => g.id);

    const statusPages = await this.prisma.statusPage.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    });
    const statusPageIds = statusPages.map((s) => s.id);

    const incidents = await this.prisma.incident.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: { id: true },
    });
    const incidentIds = incidents.map((i) => i.id);

    // ── Delete everything in dependency order ───────────────────────────
    // Monitor check results
    if (monitorIds.length > 0) {
      await this.prisma.checkResult.deleteMany({
        where: { monitorId: { in: monitorIds } },
      });
    }

    // Monitors
    if (monitorIds.length > 0) {
      await this.prisma.monitor.deleteMany({
        where: { id: { in: monitorIds } },
      });
    }

    // Error events → error groups
    if (errorGroupIds.length > 0) {
      await this.prisma.errorEvent.deleteMany({
        where: { errorGroupId: { in: errorGroupIds } },
      });
      await this.prisma.errorGroup.deleteMany({
        where: { id: { in: errorGroupIds } },
      });
    }

    // Deployments
    if (environmentIds.length > 0) {
      await this.prisma.deployment.deleteMany({
        where: { environmentId: { in: environmentIds } },
      });
    }

    // Status page services → status pages
    if (statusPageIds.length > 0) {
      await this.prisma.statusPageService.deleteMany({
        where: { statusPageId: { in: statusPageIds } },
      });
      await this.prisma.statusPage.deleteMany({
        where: { id: { in: statusPageIds } },
      });
    }

    // Alert rules (depend on alert channels, so before channels)
    await this.prisma.alertRule.deleteMany({
      where: { workspaceId: { in: workspaceIds } },
    });

    // Alert channels
    await this.prisma.alertChannel.deleteMany({
      where: { workspaceId: { in: workspaceIds } },
    });

    // Incident updates → incidents
    if (incidentIds.length > 0) {
      await this.prisma.incidentUpdate.deleteMany({
        where: { incidentId: { in: incidentIds } },
      });
      await this.prisma.incident.deleteMany({
        where: { id: { in: incidentIds } },
      });
    }

    // Environments, services, projects
    if (projectIds.length > 0) {
      await this.prisma.environment.deleteMany({
        where: { projectId: { in: projectIds } },
      });
      await this.prisma.service.deleteMany({
        where: { projectId: { in: projectIds } },
      });
      await this.prisma.project.deleteMany({
        where: { workspaceId: { in: workspaceIds } },
      });
    }

    // Notifications (user-level + workspace-level)
    await this.prisma.notification.deleteMany({
      where: { userId },
    });
    await this.prisma.notification.deleteMany({
      where: { workspaceId: { in: workspaceIds } },
    });

    // Memberships and workspaces
    await this.prisma.membership.deleteMany({
      where: { workspaceId: { in: workspaceIds } },
    });
    await this.prisma.workspace.deleteMany({
      where: { id: { in: workspaceIds } },
    });

    // Finally delete the user
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }
}
