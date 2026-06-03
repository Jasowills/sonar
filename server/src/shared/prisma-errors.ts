import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Translate a Prisma error into a clean client-facing GraphQL error.
 * Re-throws anything it does not recognise.
 *
 * MongoDB does not enforce foreign keys so P2003 is not applicable here.
 * Composite unique violations are caught by application-level checks and
 * never reach Prisma. Single-field @unique violations still raise P2002.
 */
export function mapPrismaError(error: unknown): never {
  const prismaError = error as { code?: string; name?: string; clientVersion?: string };

  if (prismaError.code === 'P2002') {
    throw new ConflictException(
      'A record with these details already exists in this scope.',
    );
  }

  if (prismaError.code === 'P2025') {
    throw new NotFoundException('The requested record was not found.');
  }

  // Connection errors (PrismaClientInitializationError, PrismaClientKnownRequestError)
  // have no code but are not application-level failures.
  if (
    prismaError.name === 'PrismaClientInitializationError' ||
    prismaError.name === 'PrismaClientRustPanicError'
  ) {
    throw new InternalServerErrorException(
      'Database is unavailable. Check your DATABASE_URL and ensure MongoDB is running.',
    );
  }

  throw new InternalServerErrorException(
    'An unexpected database error occurred. Please try again.',
  );
}
