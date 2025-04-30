import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket, SubscribeMessage, MessageBody } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { ChatService } from "./chat.service";
import { MessageService } from "./message.service";
import { UseGuards } from "@nestjs/common";
import { authGuardSocket } from "../../guards/WS.guard";

@WebSocketGateway(4002, {
    cors: { origin: "*" }
})
@UseGuards(authGuardSocket)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    onlineUsers = new Map<string, string>()
    constructor(private chatService: ChatService, private messageService: MessageService) { }
    @WebSocketServer() server: Server;

    handleConnection(client: any, ...args: any[]) {
        console.log('Client connected:', client.id);
        this.onlineUsers.set(client.id, client.data.user.id);
        this.server.emit('onlineUsers', Array.from(this.onlineUsers.values()));

    }
    handleDisconnect(client: any) {
        console.log('Client disconnected:', client.id);
        this.onlineUsers.delete(client.id);
        this.server.emit('onlineUsers', Array.from(this.onlineUsers.values()));
    }
    afterInit(server: any) {
        console.log('WebSocket server initialized');
    }
    @SubscribeMessage('getOnlineUsers')
    handleGetOnlineUsers(@ConnectedSocket() client: any) {
        const onlineUsers = Array.from(this.onlineUsers.values());
        client.emit('onlineUsers', onlineUsers);
    }
    @SubscribeMessage('sendMessage')
    async handleMessage(@ConnectedSocket() client: any, @MessageBody() data: { chatId: string; content: string }) {
        const { chatId, content } = data;
        const userId = client.data.user.id;
        const message = await this.messageService.createMessage(userId, chatId, content);
        this.server.to(chatId).emit('message', message);
    }

    @SubscribeMessage('updateMessage')
    async handleUpdateMessage(@ConnectedSocket() client: any, @MessageBody() data: { messageId: string; content: string }) {
        const { messageId, content } = data;
        const userId = client.data.user.id;
        const message = await this.messageService.updateMessage(messageId, userId, content);
        this.server.to(message.chatId).emit('messageUpdated', message);
    }

    @SubscribeMessage('typing')
    async handleTyping(@ConnectedSocket() client: any, @MessageBody() data: { chatId: string }) {
        const { chatId } = data;
        const userId = client.data.user.id;
        this.server.to(chatId).emit('typing', { userId });
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(@ConnectedSocket() client: any, @MessageBody() data: { chatId: string }) {
        const { chatId } = data;
        const userId = client.data.user.id;
        const messages = await this.messageService.markMessageAsRead(chatId, userId);
        this.server.to(chatId).emit('messagesRead', messages);
    }

    @SubscribeMessage('joinChat')
    async handleJoinChat(
        @MessageBody() chatId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(chatId);
        client.emit('joinedChat', { chatId });
    }

    @SubscribeMessage('leaveChat')
    async handleLeaveChat(
        @MessageBody() chatId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(chatId);
        client.emit('leftChat', { chatId });
    }

    @SubscribeMessage('changeStatus')
    async handleChangeStatus(
        @MessageBody() data: { chatId: string; status: "SENT" | "DELIVERED" | "READ" },
        @ConnectedSocket() client: Socket,
    ) {
        const { chatId, status } = data;
        const userId = client.data.user.id;
        const updatedChat = await this.messageService.changeMessageStatus(chatId, userId, status);
        this.server.to(chatId).emit('statusChanged', updatedChat);
    }

    @SubscribeMessage('isUserOnline')
    handleIsUserOnline(@ConnectedSocket() client: any, @MessageBody() data: { userId: string }) {
        const { userId } = data;
        const isOnline = Array.from(this.onlineUsers.values()).includes(userId);
        client.emit('isUserOnline', { userId, isOnline });
    }
    
}