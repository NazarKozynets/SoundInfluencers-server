import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    afterInit(server: Server) {
    }

    handleConnection(client: Socket) {
    }

    handleDisconnect(client: Socket) {
    }

    @SubscribeMessage('message')
    handleMessage(@MessageBody() data: { sender: string; message: string }): void {
        console.log('Received message:', data);
        this.server.emit('message', data); 
    }
}
