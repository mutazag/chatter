import { PrismaClient } from '@prisma/client';

// Create a separate Prisma client for test cleanup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
    }
  }
});

export class TestDbCleanup {
  private static createdUsers: string[] = [];
  private static createdRooms: string[] = [];

  /**
   * Register a user for cleanup after test
   */
  static registerUser(email: string) {
    this.createdUsers.push(email);
  }

  /**
   * Register a room for cleanup after test
   */
  static registerRoom(roomId: string) {
    this.createdRooms.push(roomId);
  }

  /**
   * Clean up all test data created during tests
   */
  static async cleanup() {
    try {
      // Clean up in reverse dependency order

      // 1. Delete messages (depends on users and rooms)
      await prisma.message.deleteMany({
        where: {
          OR: [
            { authorId: { in: await this.getUserIds() } },
            { roomId: { in: this.createdRooms } }
          ]
        }
      });

      // 2. Delete direct messages
      await prisma.directMessage.deleteMany({
        where: {
          OR: [
            { senderId: { in: await this.getUserIds() } },
            { receiverId: { in: await this.getUserIds() } }
          ]
        }
      });

      // 3. Delete room memberships
      await prisma.roomMembership.deleteMany({
        where: {
          OR: [
            { userId: { in: await this.getUserIds() } },
            { roomId: { in: this.createdRooms } }
          ]
        }
      });

      // 4. Delete images
      await prisma.image.deleteMany({
        where: {
          uploadedById: { in: await this.getUserIds() }
        }
      });

      // 5. Delete rooms (make sure to delete created rooms, and rooms created by test users)
      await prisma.room.deleteMany({
        where: {
          OR: [
            { id: { in: this.createdRooms } },
            { creatorId: { in: await this.getUserIds() } }
          ]
        }
      });

      // 6. Delete users (this should cascade to most related data)
      if (this.createdUsers.length > 0) {
        await prisma.user.deleteMany({
          where: {
            email: { in: this.createdUsers }
          }
        });
      }

      // Clear the tracking arrays
      this.createdUsers = [];
      this.createdRooms = [];

    } catch (error) {
      console.error('Error during test cleanup:', error);
      // Don't throw - we don't want test cleanup to break other tests
    }
  }

  /**
   * Clean up test data by pattern (for tests that use timestamp-based naming)
   */
  static async cleanupByPattern(pattern: string) {
    try {
      // Find users matching the pattern
      const usersToDelete = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: pattern } },
            { email: { contains: pattern } }
          ]
        },
        select: { id: true, email: true }
      });

      const userIds = usersToDelete.map(u => u.id);
      const userEmails = usersToDelete.map(u => u.email);

      if (userIds.length === 0) return;

      // Delete in dependency order
      await prisma.message.deleteMany({
        where: { authorId: { in: userIds } }
      });

      await prisma.directMessage.deleteMany({
        where: {
          OR: [
            { senderId: { in: userIds } },
            { receiverId: { in: userIds } }
          ]
        }
      });

      await prisma.roomMembership.deleteMany({
        where: { userId: { in: userIds } }
      });

      await prisma.image.deleteMany({
        where: { uploadedById: { in: userIds } }
      });

      await prisma.room.deleteMany({
        where: { creatorId: { in: userIds } }
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });

      console.log(`Cleaned up ${userEmails.length} test users matching pattern: ${pattern}`);

    } catch (error) {
      console.error('Error during pattern-based cleanup:', error);
    }
  }

  /**
   * Get user IDs for cleanup
   */
  private static async getUserIds(): Promise<string[]> {
    if (this.createdUsers.length === 0) return [];

    const users = await prisma.user.findMany({
      where: {
        email: { in: this.createdUsers }
      },
      select: { id: true }
    });

    return users.map(u => u.id);
  }

  /**
   * Generate unique test identifier
   */
  static generateTestId(): string {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.random().toString(36).substring(2, 5); // 3 random chars
    return `${timestamp}${random}`;
  }

  /**
   * Generate unique test email
   */
  static generateTestEmail(prefix = 'test'): string {
    const testId = this.generateTestId();
    const email = `${prefix}${testId}@example.com`;
    this.registerUser(email);
    return email;
  }

  /**
   * Generate unique test username
   */
  static generateTestUsername(prefix = 'user'): string {
    const testId = this.generateTestId();
    return `${prefix}${testId}`;
  }

  /**
   * Close database connection
   */
  static async disconnect() {
    await prisma.$disconnect();
  }
}

export { prisma as testPrisma };