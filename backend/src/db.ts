import { PrismaClient } from '@prisma/client';

/** Single Prisma client. Lazy — no connection is made until the first query or $connect(). */
export const prisma = new PrismaClient();
