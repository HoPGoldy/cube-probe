import { hashPassword, shaWithSalt } from "@/lib/crypto";
import { PrismaClient, UserRole } from "@prisma/client";

export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async seed() {
    try {
      await this.$queryRaw`PRAGMA journal_mode = WAL;`;
      console.log("[sqlite] WAL mode enabled");

      const result = (await this.$queryRaw`PRAGMA auto_vacuum;`) as any[];
      const status = result[0]?.auto_vacuum;

      console.log(`[sqlite] auto_vacuum status: ${status}`);
    } catch (error) {
      console.error("Error setting WAL mode:", error);
    }

    const result = await this.$transaction(async (tx) => {
      const userCount = await tx.user.count();
      if (userCount === 0) {
        const user = await tx.user.create({
          data: {
            username: "admin",
            role: UserRole.ADMIN,
            passwordHash: hashPassword(shaWithSalt("admin", "admin")),
          },
        });

        return user;
      }
      return null;
    });

    if (result) {
      console.log("Created admin user:", result);
    } else {
      // console.log("User table is not empty, skipped seeding");
    }
  }
}
