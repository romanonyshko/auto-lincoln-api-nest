import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { AUTH_COOKIE_NAME, LoginRequestSchema, type LoginRequest, type LoginResponse } from '@auto-lincoln/contracts'
import { AuthService } from './auth.service.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { signSession, SESSION_MAX_AGE_MS, SESSION_COOKIE_OPTIONS, type Session } from './lib/session.js'
import { toLoginResponse } from './mappers/to-login-response.js'
import { env } from '../../config/env.js'
import { AuthGuard } from './guards/auth.guard.js'
import { CurrentSession } from './decorators/current-session.decorator.js'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
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

    @Get('me')
    @UseGuards(AuthGuard)
    async me(@CurrentSession() session: Session): Promise<LoginResponse> {
        const user = await this.authService.findById(session.userId)
        if (!user) throw new UnauthorizedException('Not authenticated')
        return toLoginResponse(user)
    }

    @Post('logout')
    @HttpCode(204)
    logout(@Res({ passthrough: true }) res: Response): void {
        res.clearCookie(AUTH_COOKIE_NAME, SESSION_COOKIE_OPTIONS)
    }

}