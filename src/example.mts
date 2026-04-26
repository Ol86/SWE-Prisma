import process from 'node:process';
import { styleText } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import { prismaQueryInsights } from '@prisma/sqlcommenter-query-insights';
import {
    PrismaClient,
    type Member,
    type Prisma,
} from './generated/prisma/client.ts';

let message = styleText(['black', 'bgWhite'], 'Node version');
console.log(`${message}=${process.version}`);
message = styleText(['black', 'bgWhite'], 'DATABASE_URL');
console.log(`${message}=${process.env['DATABASE_URL']}`);
console.log();

// Create the Prisma Client with the PrismaPg adapter
const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL'],
});

// Define the logging configuration for Prisma Client
const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = [
    {
        emit: 'event',
        level: 'query',
    },
    'info',
    'warn',
    'error',
];

// Instantiate the Prisma Client with the specified adapter, logging configuration, and query insights
const prisma = new PrismaClient({
    adapter,
    errorFormat: 'pretty',
    log,
    comments: [prismaQueryInsights()],
});
prisma.$on('query', (event) => {
    message = styleText('green', `Query: ${event.query}`);
    console.log(message);
    message = styleText('cyan', `Duration: ${event.duration}ms`);
    console.log(message);
});

export type MemberWithAddressAndBook = Prisma.MemberGetPayload<{
    include: {
        address: true;
        books: true;
    };
}>;

try {
    await prisma.$connect();

    // Fetch a single member by ID
    const member: Member | null = await prisma.member.findUnique({
        where: { id: 1 },
    });
    message = styleText(['black', 'bgWhite'], 'member');
    console.log(`${message} = %j`, member);
    console.log();

    // Fetch members with related address and books data
    const members: MemberWithAddressAndBook[] = await prisma.member.findMany({
        where: {
            isStudent: true,
        },
        // Include related address and books data in the query result
        include: {
            address: true,
            books: true,
        },
    });
    message = styleText(['black', 'bgWhite'], 'members');
    console.log(`${message} = %j`, members);
    console.log();

    // Arrow function example: Extract usernames from the members array
    const username = members.map((m) => m.username);
    message = styleText(['black', 'bgWhite'], 'usernames');
    console.log(`${message} = %j`, username);
    console.log();

    // Pagination example: Fetch the first page of members (1 member per page)
    const membersPage2: Member[] = await prisma.member.findMany({
        skip: 1,
        take: 1,
    });
    message = styleText(['black', 'bgWhite'], 'membersPage2');
    console.log(`${message} = %j`, membersPage2);
    console.log();
} finally {
    await prisma.$disconnect();
}

const adapterAdmin = new PrismaPg({
    connectionString: process.env['DATABASE_URL_ADMIN'],
});
const prismaAdmin = new PrismaClient({
    adapter: adapterAdmin,
});
try {
    await prismaAdmin.$connect();

    // Fetch all members using the admin client
    const allMembers: Member[] = await prismaAdmin.member.findMany();
    message = styleText(['black', 'bgWhite'], 'allMembers (admin)');
    console.log(`${message} = ${JSON.stringify(allMembers)}`);
    console.log();
} finally {
    await prismaAdmin.$disconnect();
}
