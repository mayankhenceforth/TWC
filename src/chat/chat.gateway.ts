import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to store userId -> socketId
  private connectedUsers = new Map<string, string>();

  // Called when client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Called when client disconnects
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove disconnected user
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.server.emit('user_disconnected', { userId });
        break;
      }
    }
  }

  // User connects with their ID
  @SubscribeMessage('user_connect')
  handleConnect(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    if (!userId) {
      client.emit('error', 'User ID is required');
      return;
    }

    this.connectedUsers.set(userId, client.id);
    console.log(`User ${userId} connected with socket ${client.id}`);

    client.emit('connected', { userId });
    this.server.emit('user_online', { userId });
  }

  // Send chat message
  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody()
    payload: { senderId: string; receiverId?: string; groupId?: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { senderId, receiverId, groupId, message } = payload;

    if (receiverId) {
      // Private chat
      const receiverSocket = this.connectedUsers.get(receiverId);
      if (receiverSocket) {
        this.server.to(receiverSocket).emit('receive_message', { senderId, message });
      } else {
        client.emit('error', `User ${receiverId} is offline`);
      }
    } else if (groupId) {
      // Group chat (broadcast to all except sender)
      this.server.to(groupId).emit('receive_group_message', { senderId, groupId, message });
    } else {
      client.emit('error', 'ReceiverId or GroupId is required');
    }
  }

  // Join a group (room)
  @SubscribeMessage('join_group')
  handleJoinGroup(
    @MessageBody() data: { userId: string; groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.groupId);
    this.server.to(data.groupId).emit('user_joined', { userId: data.userId, groupId: data.groupId });
  }
}
