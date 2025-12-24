import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

if (process.env.NODE_ENV === 'development') {
    const url = process.env.DATABASE_URL;
    if (url && url.includes('render.com') && url.includes('dpg-')) {
        console.warn("\n⚠️  WARNING: You seem to be using an internal Render Database URL locally.");
        console.warn("   This will likely fail with connection timeouts.");
        console.warn("   Please check your Render Dashboard for the 'External Database URL'.\n");
    }
}
