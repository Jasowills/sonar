import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberModel } from './models/member.model';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string): Promise<MemberModel[]> {
    try {
      const memberships = await this.prisma.membership.findMany({
        where: { workspaceId },
        include: { user: true },
      });
      return memberships.map((m) => ({
        id: m.id,
        role: m.role,
        user: {
          id: m.user.id,
          email: m.user.email,
          fullName: m.user.fullName,
          avatarUrl: m.user.avatarUrl,
        },
      }));
    } catch {
      return [];
    }
  }
}
