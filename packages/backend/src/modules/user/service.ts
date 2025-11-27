import { hashPassword } from "@/lib/crypto";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@db/client";
import {
  SchemaChangePasswordType,
  SchemaUserCreateType,
  SchemaUserUpdateType,
} from "./schema";
import { SchemaCommonListFilterType } from "@/types/schema";

interface ServiceOptions {
  prisma: PrismaClient;
}

export class UserService {
  constructor(private options: ServiceOptions) {}

  async findById(id: string) {
    return this.options.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByUsername(username: string) {
    return this.options.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: SchemaUserCreateType) {
    return this.options.prisma.user.create({
      data: { ...data, passwordHash: hashPassword(data.passwordHash) },
    });
  }

  async findAll(params: SchemaCommonListFilterType) {
    const { page = 1, size = 10, keyword } = params;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      username: {
        contains: keyword,
      },
    };

    const [items, total] = await this.options.prisma.$transaction([
      this.options.prisma.user.findMany({
        skip: page ? (page - 1) * size : 0,
        take: size,
        where,
        orderBy: {
          createdAt: "asc",
        },
      }),
      this.options.prisma.user.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async update(data: SchemaUserUpdateType) {
    const { id, passwordHash, ...extraData } = data;
    console.log("updateData", extraData);

    const user = await this.findById(id);
    if (!user) {
      throw new Error("用户不存在");
    }

    const updateData: Prisma.UserUpdateInput = {
      ...extraData,
    };

    if (passwordHash) {
      updateData.passwordHash = hashPassword(passwordHash);
    }

    return this.options.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async fakeDelete(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("用户不存在");
    }

    return this.options.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        username: `${user.username}<deleted ${nanoid()}>`,
      },
    });
  }

  async changePassword(id: string, data: SchemaChangePasswordType) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("用户不存在");
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(data.oldP, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("当前密码不正确");
    }

    return this.options.prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashPassword(data.newP),
      },
    });
  }
}
