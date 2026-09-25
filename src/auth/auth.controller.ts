import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { Response, Request } from 'express'
import { AUTH_COOKIE_NAME, LoginRequestSchema, type LoginRequest, type LoginResponse } from '@auto-lincoln/contracts'
import { AuthService } from './auth.service.js'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { signSession, SESSION_MAX_AGE_MS, SESSION_COOKIE_OPTIONS } from './session.js'
import { toLoginResponse } from './to-login-response.js'
import { env } from '../config/env.js'
import { AuthGuard } from './auth.guard.js'
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
    me(@Req() req: Request) {
        return req.session
    }
}