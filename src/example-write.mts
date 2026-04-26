import { PrismaPg } from '@prisma/adapter-pg';
import process from 'node:process';
import { styleText } from 'node:util';
import { PrismaClient, type Prisma } from './generated/prisma/client.ts';

let message = styleText(
    'yellow',
    `process.env['DATABASE_URL']=${process.env['DATABASE_URL']}`,
);
console.log(message);
console.log();

const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL'],
});

const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = [
    {
        emit: 'event',
        level: 'query',
    },
    'info',
    'warn',
    'error',
];

const prisma = new PrismaClient({
    adapter,
    errorFormat: 'pretty',
    log,
});
prisma.$on('query', (event) => {
    message = styleText('green', `Query: ${event.query}`);
    console.log(message);
    message = styleText('cyan', `Duration: ${event.duration}ms`);
    console.log(message);
});

const createdMember: Prisma.MemberCreateInput = {
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    emailAddress: 'john.doe@example.com',
    dateOfBirth: new Date('1990-01-01'),
    isStudent: false,
    address: {
        create: {
            postalCode: '12345',
            place: 'Musterstadt',
        },
    },
};
type CreatedMember = Prisma.MemberGetPayload<{
    include: {
        address: true;
    };
}>;

const updatedMember: Prisma.MemberUpdateInput = {
    version: { increment: 1 },
    firstName: 'John',
};
type UpdatedMember = Prisma.MemberGetPayload<{}>; // eslint-disable-line @typescript-eslint/no-empty-object-type

try {
    await prisma.$connect();

    await prisma.$transaction(async (p) => {
        const memberDb: CreatedMember = await p.member.create({
            data: createdMember,
            include: {
                address: true,
            },
        });
        message = styleText(['black', 'bgWhite'], 'Generated ID:');
        console.log(`${message} ${memberDb.id}`);
        console.log();

        const memberUpdated: UpdatedMember = await p.member.update({
            where: { id: memberDb.id },
            data: updatedMember,
        });
        // eslint-disable-next-line require-atomic-updates
        message = styleText(['black', 'bgWhite'], 'Updated Member:');
        console.log(`${message} ${memberUpdated.version}`);
        console.log();

        const memberDeleted = await p.member.delete({
            where: { id: 3 },
        });
        // eslint-disable-next-line require-atomic-updates
        message = styleText(['black', 'bgWhite'], 'Deleted Member:');
        console.log(`${message} ${memberDeleted.id}`);
        console.log();
    });
} finally {
    await prisma.$disconnect();
}
