import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (!existingUser) {
    console.log('Creating admin user...');
    
    // Create admin user
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Admin',
        lastName: 'User'
      }
    });
    
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists, skipping creation');
  }
  
  // Create a test device if none exists
  const deviceCount = await prisma.device.count();
  
  if (deviceCount === 0) {
    console.log('Creating a test device...');
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (adminUser) {
      await prisma.device.create({
        data: {
          id: 'test-device-001',
          name: 'Test Device',
          userId: adminUser.id,
          thresholdRed: 15,
          thresholdYellow: 40,
          thresholdGreen: 70
        }
      });
      
      console.log('Test device created successfully');
    }
  } else {
    console.log('Devices already exist, skipping creation');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 