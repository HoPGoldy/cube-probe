import { Prisma, PrismaClient } from "@db/client";
import {
  SchemaApplicationCreateType,
  SchemaApplicationUpdateType,
} from "./schema";
import { SchemaCommonListFilterType } from "@/types/schema";

interface ServiceOptions {
  prisma: PrismaClient;
}

export class ApplicationService {
  constructor(private options: ServiceOptions) {}

  async findById(id: string) {
    return this.options.prisma.application.findUnique({
      where: { id },
    });
  }

  async create(data: SchemaApplicationCreateType) {
    return this.options.prisma.application.create({
      data,
    });
  }

  async findAll(params: SchemaCommonListFilterType) {
    const { page = 1, size = 10, keyword } = params;

    const where: Prisma.ApplicationWhereInput = {
      name: {
        contains: keyword,
      },
    };

    const [items, total] = await this.options.prisma.$transaction([
      this.options.prisma.application.findMany({
        skip: page ? (page - 1) * size : 0,
        take: size,
        where,
        orderBy: {
          createdAt: "asc",
        },
      }),
      this.options.prisma.application.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async update(data: SchemaApplicationUpdateType) {
    const { id, ...updateData } = data;

    const application = await this.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }

    return this.options.prisma.application.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const application = await this.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }

    return this.options.prisma.application.delete({
      where: { id },
    });
  }
}
