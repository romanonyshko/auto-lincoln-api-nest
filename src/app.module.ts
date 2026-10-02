import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ChatModule } from './modules/chat/chat.module.js';

@Module({
  imports: [HealthModule, PrismaModule, AuthModule, DashboardModule, ChatModule],
  controllers: [],
})
export class AppModule { }
