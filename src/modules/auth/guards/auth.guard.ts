import { AUTH_COOKIE_NAME } from "@auto-lincoln/contracts";
import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { verifySession } from "../lib/session.js";
import { env } from "../../../config/env.js";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const token = req.cookies?.[AUTH_COOKIE_NAME]
    if (!token) throw new UnauthorizedException('Not authenticated')

    try {
      req.session = await verifySession(token, env.jwtSecret)
    } catch {
      throw new UnauthorizedException('Not authenticated')
    }
    return true
  }
}
