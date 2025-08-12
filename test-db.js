const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count();
    console.log('Total users in database:', userCount);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });
      console.log('Existing users:', users);
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
