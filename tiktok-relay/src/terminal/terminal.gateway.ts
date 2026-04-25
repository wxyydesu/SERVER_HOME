import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, WebSocket } from 'ws';

@WebSocketGateway({
  path: '/ws',
})
export class TerminalGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private windowsClient: WebSocket | null = null;
  private browserClient: WebSocket | null = null;

  private readonly SECRET = process.env.SECRET_KEY;

  handleConnection(client: WebSocket) {
    console.log('🔌 Client connected');

    client.on('message', (msg: string) => {
      try {
        const data = JSON.parse(msg.toString());

        if (data.role === 'windows') {
          if (data.token !== this.SECRET) {
            client.close();
            return;
          }
          this.windowsClient = client;
          console.log('> Windows connected <');
          return;
        }

        if (data.role === 'browser') {
          if (data.token !== this.SECRET) {
            client.close();
            return;
          }
          this.browserClient = client;
          console.log('> Browser connected <');
          return;
        }

        if (data.type === 'output' && this.browserClient) {
          this.browserClient.send(JSON.stringify(data));
          return;
        }

        if (data.type === 'input' && this.windowsClient) {
          this.windowsClient.send(JSON.stringify(data));
          return;
        }

        if ((data.type === 'start' || data.type === 'stop') && this.windowsClient) {
          this.windowsClient.send(JSON.stringify(data));
          return;
        }

      } catch (err) {
        console.log('Error:', err);
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    if (client === this.windowsClient) {
      this.windowsClient = null;
      console.log('> Windows disconnected <');
    }

    if (client === this.browserClient) {
      this.browserClient = null;
      console.log('> Browser disconnected <');
    }
  }
}