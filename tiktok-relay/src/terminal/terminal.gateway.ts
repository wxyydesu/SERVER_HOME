import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, WebSocket } from 'ws';

@WebSocketGateway({
  path: '/',
})
export class TerminalGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  windowsClient: WebSocket | null = null;
  browserClient: WebSocket | null = null;

  handleConnection(client: WebSocket) {
    console.log('Client connected');

    client.on('message', (msg: string) => {
      const data = JSON.parse(msg.toString());

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
    });
  }

  handleDisconnect() {
    console.log('Client disconnected');
  }
}