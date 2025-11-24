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
      console.log("User table is not empty, skipped seeding");
    }
  }
}
