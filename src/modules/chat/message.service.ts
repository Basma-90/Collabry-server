import{Injectable} from'@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';

@Injectable()

export class MessageService {
    constructor(private prisma : PrismaService,
        private cloudinaryService: CloudinaryService, 
    ) {}

    async createMessage(userId: string, chatId: string, content: string) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const message = await this.prisma.chatMessage.create({
            data: {
                senderId:userId,
                chatId,
                content,
            },
        });
        return message;
    }
    async getMessages(chatId ,userId){
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const messages = await this.prisma.chatMessage.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
        });
        return messages;
    }
    async deleteMessage(messageId: string, userId: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('User is not the sender of this message');
        }
        await this.prisma.chatMessage.delete({
            where: { id: messageId },
        });
        return { message: 'Message deleted successfully' };
    }
    async updateMessage(messageId :string , userId:string, content:string){
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('User is not the sender of this message');
        }
        const updatedMessage = await this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { content },
        });
        return updatedMessage;
    }
    async markMessageAsRead(messageId:string, userId:string){
        const message = await this.prisma.chatMessage.findUnique({
            where:{id:messageId},
        });
        if (!message) {
            throw new Error('Message not found');
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: message.chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        await this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { status: 'READ' },
        });
    }
    async starMessage(messageId :string , userId:string){
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: message.chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const starredMessage = await this.prisma.chatMessage.update({
            where:{
                id:messageId,
            },
            data:{
                isStarred:true,
            }
        })
        return starredMessage;
    }
    async unstarMessage(messageId:string , userId:string){
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: message.chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const unstarredMessage = await this.prisma.chatMessage.update({
            where:{
                id:messageId,
            },
            data:{
                isStarred:false,
            }
        })
        return unstarredMessage;
    }
    async getStarredMessages(userId:string , chatId){
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const starredMessages = await this.prisma.chatMessage.findMany({
            where: { chatId, isStarred: true },
            orderBy: { createdAt: 'desc' },
        });
        return starredMessages;
    }
    async changeMessageStatus(messageId: string, userId: string, status: 'SENT' | 'DELIVERED' | 'READ') {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: message.chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const updatedMessage = await this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { status: status },
        });
        return updatedMessage;
    }
    async sendFileMessage(userId: string, chatId: string, file: Express.Multer.File) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { participants: true },
        });
        if (!chat) {
            throw new Error('Chat not found');
        }
        const isParticipant = chat.participants.some(
            (participant) => participant.id === userId,
        );
        if (!isParticipant) {
            throw new Error('User is not a participant of this chat');
        }
        const fileUrl = await this.cloudinaryService.uploadFile(file);
        const message = await this.prisma.chatMessage.create({
            data: {
                senderId:userId,
                type:'FILE',
                chatId,
                content: fileUrl.secure_url,
            },
        });
        return message;
    }
}