import { Module } from '@nestjs/common'
import { ChatService } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';

@Module({
  controllers: [],
  providers: [ChatGateway, ChatService]
})
export class ChatModule {}
