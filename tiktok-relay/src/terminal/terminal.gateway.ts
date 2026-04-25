import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, WebSocket } from 'ws';

@WebSocketGateway()
export class TerminalGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  windowsClient: WebSocket | null = null;
  browserClient: WebSocket | null = null;

  handleConnection(client: WebSocket) {
    console.log('Client connected');
  }

  handleDisconnect(client: WebSocket) {
    console.log('Client disconnected');

    if (this.windowsClient === client) this.windowsClient = null;
    if (this.browserClient === client) this.browserClient = null;
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: WebSocket,
  ) {
    try {
      if (data.role === 'windows') {
        this.windowsClient = client;
        console.log('Windows connected');
      }

      if (data.role === 'browser') {
        this.browserClient = client;
        console.log('Browser connected');
      }

      if (data.type === 'output' && this.browserClient) {
        this.browserClient.send(JSON.stringify(data));
      }

      if (data.type === 'input' && this.windowsClient) {
        this.windowsClient.send(JSON.stringify(data));
      }

      if (
        (data.type === 'start' || data.type === 'stop') &&
        this.windowsClient
      ) {
        this.windowsClient.send(JSON.stringify(data));
      }
    } catch (e) {
      console.log('Message error');
    }
  }
}