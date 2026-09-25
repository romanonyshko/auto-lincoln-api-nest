import type { CookieOptions } from 'express'
import type { UserRole } from '../../../db/generated/prisma/enums.js'
import { jwtVerify, SignJWT } from 'jose'

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
}

export interface Session {
  userId: string
  role: UserRole
}

export function signSession(userId: string, role: UserRole, secret: string) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret))
}

export async function verifySession(token: string, secret: string): Promise<Session> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
  return { userId: payload.sub as string, role: payload.role as UserRole }
}
