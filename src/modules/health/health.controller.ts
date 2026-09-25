import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service.js";

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStatus(): Promise<{ status: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  }
}