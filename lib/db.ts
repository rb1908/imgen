import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const getDBUrl = () => {
    const url = process.env.DATABASE_URL;
    if (url && url.includes('6543') && !url.includes('pgbouncer=true')) {
        return url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    return url;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: getDBUrl(),
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
