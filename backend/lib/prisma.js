const { PrismaClient } = require('../prisma/generated/client');


const globalForPrisma = global;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

const prisma = globalForPrisma.prisma;

module.exports = prisma;
