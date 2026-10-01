import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';

@Module({
  imports: [HealthModule, PrismaModule, AuthModule, DashboardModule],
  controllers: [],
})
export class AppModule { }
