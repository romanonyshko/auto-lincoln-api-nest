import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [HealthModule, PrismaModule, AuthModule],
  controllers: [],
})
export class AppModule { }
