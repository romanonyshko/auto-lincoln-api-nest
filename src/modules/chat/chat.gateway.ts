import { AUTH_COOKIE_NAME, ClientChatEventSchema, WS_ROUTES, type ServerChatEvent } from "@auto-lincoln/contracts";
import { WebSocketGateway, type OnGatewayConnection, type OnGatewayDisconnect } from "@nestjs/websockets";
import { ChatService } from "./chat.service.js";
import type { IncomingMessage } from "node:http"
import type { WebSocket } from 'ws'
import { env } from '../../config/env.js';
import { parseCookie } from "cookie";
import { verifySession, type Session } from "../auth/lib/session.js";


@WebSocketGateway({ path: WS_ROUTES.chat })
export class ChatGateway implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket> {
    private readonly sessions = new WeakMap<WebSocket, Session>

    constructor(private readonly chatService: ChatService) { }

    private async authenticate(req: IncomingMessage): Promise<Session | null> {
        const token = parseCookie(req.headers.cookie ?? '')[AUTH_COOKIE_NAME]

        if (!token) { return null }
        try { return await verifySession(token, env.jwtSecret) }
        catch { return null }
    }

    async handleConnection(client: WebSocket, req: IncomingMessage) {
        if (req.headers.origin !== env.corsOrigin) {
            client.close(4403)
            return
        }

        const session = await this.authenticate(req)

        if (!session) {
            client.close(4401)
            return
        }

        this.sessions.set(client, session)

        this.send(client, { type: "message:new", message: this.chatService.greeting() })

        client.on('message', raw => {
            if (!this.sessions.has(client)) return

            let data: unknown
            try {data = JSON.parse(raw.toString()) }
            catch {
                this.send(client, { type: 'error', code: "INVALID_JSON", message: 'Message must be valid JSON' }) 
                return
            }

            const result = ClientChatEventSchema.safeParse(data)

            if (!result.success) {
                this.send(client, {
                    type: 'error',
                    code: "VALIDATION_ERROR",
                    message: result.error.issues[0]?.message ?? 'Invalid message',
                })
                return
            }

            this.send(client, {
                type: "message:new",
                message: this.chatService.reply(result.data)
            })
        })
    }

    handleDisconnect(client: WebSocket) {
        this.sessions.delete(client)
    }

    private send(client: WebSocket, event: ServerChatEvent) {
        if (client.readyState !== client.OPEN) return

        client.send(JSON.stringify(event))
    }
}