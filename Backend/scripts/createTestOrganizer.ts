import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma';
import process from "process";

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Testkontot får inte skapas i produktion.');
    }

    const passwordHash = await bcrypt.hash('CorideTest2026!', 12);

    await prisma.organizer.upsert({
        where: {
            email: 'test@example.com',
        },
        update: {
            password_hash: passwordHash,
        },
        create: {
            name: 'Testarrangör',
            email: 'test@example.com',
            password_hash: passwordHash,
        },
    });

    console.log('Testkonto klart: test@example.com');
}

main()
    .catch(error => {
        console.error('Kunde inte skapa testkontot:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });