import { createParamDecorator, type ExecutionContext } from "@nestjs/common"
import type { Session } from '../lib/session.js'
import type { Request } from "express"

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Session => {
    const req = context.switchToHttp().getRequest<Request>()
    if (!req.session) {
      throw new Error('@CurrentSession() used without AuthGuard')
    }
    return req.session
  },
)
