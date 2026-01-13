import 'dotenv/config';
import { prisma } from './lib/db';

async function main() {
    const projects = await prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    console.log("--- Last 5 Projects ---");
    projects.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`URL: ${p.originalImageUrl}`);
        console.log(`-------------------------`);
    });
}

main();
