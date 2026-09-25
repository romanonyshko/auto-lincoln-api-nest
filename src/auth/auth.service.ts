
import { Injectable } from '@nestjs/common'
import { verifyPassword } from './password.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { User } from '../db/generated/prisma/client.js'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return null

    const isValid = await verifyPassword(password, user.passwordHash)
    return isValid ? user : null
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }
}
