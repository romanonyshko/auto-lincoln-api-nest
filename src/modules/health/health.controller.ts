import { Controller, Get } from "@nestjs/common";
import { API_ROUTES } from "@auto-lincoln/contracts";
import { PrismaService } from "../../core/prisma/prisma.service.js";

@Controller(API_ROUTES.health)
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStatus(): Promise<{ status: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  }
}