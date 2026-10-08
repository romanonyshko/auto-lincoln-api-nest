import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { API_ROUTES, AUTH_COOKIE_NAME, LoginRequestSchema, type LoginRequest, type LoginResponse, type WsTicketResponse } from '@auto-lincoln/contracts'
import { AuthService } from './auth.service.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { signSession, signWsTicket, SESSION_MAX_AGE_MS, SESSION_COOKIE_OPTIONS, type Session } from './lib/session.js'
import { toLoginResponse } from './mappers/to-login-response.js'
import { env } from '../../config/env.js'
import { AuthGuard } from './guards/auth.guard.js'
import { CurrentSession } from './decorators/current-session.decorator.js'

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post(API_ROUTES.auth.login)
    @HttpCode(200)
    async login(
        @Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponse> {
        const user = await this.authService.validateCredentials(body.email, body.password)
        if (!user) {
            throw new UnauthorizedException('Invalid email or password')
        }
        const token = await signSession(user.id, user.role, env.jwtSecret)
        res.cookie(AUTH_COOKIE_NAME, token, {
            ...SESSION_COOKIE_OPTIONS,
            maxAge: SESSION_MAX_AGE_MS,
        })

        return toLoginResponse(user)
    }

    @Get(API_ROUTES.auth.me)
    @UseGuards(AuthGuard)
    async me(@CurrentSession() session: Session): Promise<LoginResponse> {
        const user = await this.authService.findById(session.userId)
        if (!user) throw new UnauthorizedException('Not authenticated')
        return toLoginResponse(user)
    }

    @Post(API_ROUTES.auth.wsTicket)
    @HttpCode(200)
    @UseGuards(AuthGuard)
    async wsTicket(@CurrentSession() session: Session): Promise<WsTicketResponse> {
        return { ticket: await signWsTicket(session, env.jwtSecret) }
    }

    @Post(API_ROUTES.auth.logout)
    @HttpCode(204)
    logout(@Res({ passthrough: true }) res: Response): void {
        res.clearCookie(AUTH_COOKIE_NAME, SESSION_COOKIE_OPTIONS)
    }

}