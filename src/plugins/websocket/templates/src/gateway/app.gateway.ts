import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('AppGateway');

  handleConnection(client: any) {
    this.logger.log('Client connected');
  }

  handleDisconnect(client: any) {
    this.logger.log('Client disconnected');
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): string {
    this.logger.log(`Message received: ${data}`);
    return data;
  }
}
