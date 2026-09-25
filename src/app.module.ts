import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [HealthModule, PrismaModule, AuthModule],
  controllers: [],
})
export class AppModule { }
