import type { ChatMessage, ClientChatEvent } from "@auto-lincoln/contracts";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto"
import { CHAT_GREETING } from "./chat.constants.js";

@Injectable()
export class ChatService {
    reply(event: ClientChatEvent): ChatMessage {
        return this.createMessage('support', event.text, event.clientId)
    }

    greeting(): ChatMessage {
        return this.createMessage('support', CHAT_GREETING)
    }

    private createMessage(author: ChatMessage['author'], text: string, clientId?: string): ChatMessage {
        return {
            id: randomUUID(),
            sentAt: new Date().toISOString(),
            author: author,
            text: text,
            clientId: clientId
        }
    }
}