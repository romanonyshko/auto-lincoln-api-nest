import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../db/generated/prisma/client.js'
import { env } from '../config/env.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) })
  }
  async onModuleDestroy() {
    await this.$disconnect()
  }
  
}