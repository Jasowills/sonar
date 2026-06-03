import { sign, verify, type JwtPayload } from 'jsonwebtoken';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export function issueToken(user: AuthenticatedUser): string {
  return sign(
    {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    getSecret(),
    { expiresIn: '24h' },
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const payload = verify(token, getSecret(), {
      algorithms: ['HS256'],
    }) as JwtPayload & {
      email?: string;
      name?: string | null;
      picture?: string | null;
    };

    return {
      sub: payload.sub ?? '',
      email: payload.email ?? '',
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
