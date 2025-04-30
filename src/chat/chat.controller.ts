import {
    Controller,
    Body,
    Post,
    Get,
    Param,
    Query,
    UseGuards,
    Headers,
    BadRequestException,
    UnauthorizedException,
    Request,
    Delete,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { authGuard } from '../../guards/auth.guard';
import * as dtos from './dtos/chat.create.dto'

@Controller('chat')
export class ChatController {
    constructor(
        private chatService: ChatService,
        private authService: AuthService,
        private messageService: MessageService,
    ) { }

    @UseGuards(authGuard)
    @Post('group')
    async createChat(@Body() body: dtos.createGroupChatDto) {
        const { name, userId } = body;
        if (!name || !userId) {
            throw new BadRequestException('Name and userId are required');
        }
        return await this.chatService.createGroupChat(name, userId);
    }

    @UseGuards(authGuard)
    @Post('direct')
    async createDirectChat(@Body() body: dtos.createDirectChatDto) {
        const { participantId, userId } = body;
        if (!participantId || !userId) {
            throw new BadRequestException('ParticipantId and userId are required');
        }
        return await this.chatService.createPrivateChat(participantId, userId);
    }

    @UseGuards(authGuard)
    @Post('participants')
    async addParticipants(@Body() body: dtos.addParticipantsDto) {
        const { chatId, userId, participantId } = body;
        if (!chatId || !userId || !participantId) {
            throw new BadRequestException('ChatId, userId and participantId are required');
        }
        return await this.chatService.addParticipantToGroupChat(chatId, userId, participantId);
    }

    @UseGuards(authGuard)
    @Get('chats/:chatId')
    async getChat(
        @Param('chatId') chatId: string,
        @Request() req,
    ) {
        const userId = req.user.id;
        return await this.chatService.getChatById(chatId, userId);
    }

    @UseGuards(authGuard)
    @Get('chats')
    async getChats(@Request() req) {
        const userId = req.user.id;
        return await this.chatService.getUserChats(userId);
    }

    @UseGuards(authGuard)
    @Get('messages')
    async getChatMessages(@Body() body: dtos.getChatMessagesDto) {
        const { chatId, userId } = body;
        if (!chatId || !userId) {
            throw new BadRequestException('ChatId and userId are required');
        }
        return await this.chatService.getChatMessages(chatId, userId);
    }

    @UseGuards(authGuard)
    @Post('chats/request-join')
    async requestJoinChat(@Body() chatId: string,
        @Request() req
    ) {
       const userId=req.user.id;
        if (!chatId) {
            throw new BadRequestException('ChatId is required');
        }
        return await this.chatService.requestJoinChat(chatId, userId);
    }

    @UseGuards(authGuard)
    @Post('chats/accept-join')
    async acceptJoinRequest(
        @Body() body: dtos.acceptJoinRequestDto,
        @Request() req
    ) {
        const { chatId, userId, participantId } = body;
        if (!chatId || !userId || !participantId) {
            throw new BadRequestException('ChatId, userId and participantId are required');
        }
        if(userId !== req.user.id)
        return await this.chatService.acceptJoinRequest(chatId, userId, participantId);
    }

    @UseGuards(authGuard)
    @Post('chats/reject-join')
    async rejectJoinRequest(
        @Body() body: dtos.rejectJoinRequestDto,
        @Request() req
    ) {
        const { chatId, userId, participantId } = body;
        if (!chatId || !userId || !participantId) {
            throw new BadRequestException('ChatId, userId and participantId are required');
        }
        if(userId !== req.user.id)
        return await this.chatService.rejectJoinRequest(chatId, userId, participantId);
    }

    @UseGuards(authGuard)
    @Post('chats/leave')
    async leaveChat(
        @Body() body: dtos.leaveChatDto,
        @Request() req
    ) {
        const { chatId, userId } = body;
        if (!chatId || !userId) {
            throw new BadRequestException('ChatId and userId are required');
        }
        if(userId !== req.user.id)
        return await this.chatService.leaveChat(chatId, userId);
    }

    @UseGuards(authGuard)
    @Post('chats/delete-direct')
    async deleteDirectChat(
        @Body() body: dtos.deleteChatDto,
        @Request() req
    ) {
        const { chatId, userId } = body;
        if (!chatId || !userId) {
            throw new BadRequestException('ChatId and userId are required');
        }
        if(userId !== req.user.id)
        return await this.chatService.deleteCopyOfChat(chatId, userId);
    }

    @UseGuards(authGuard)
    @Post('chats/delete-group')
    async deleteGroupChat(
        @Body() body: dtos.deleteChatDto,
        @Request() req
    ) {
        const { chatId, userId } = body;
        if (!chatId || !userId) {
            throw new BadRequestException('ChatId and userId are required');
        }
        if(userId !== req.user.id)
        return await this.chatService.deleteGroupChat(chatId, userId);
    }

    @UseGuards(authGuard)
    @Get('messages/:chatId')
    async getMessages(
        @Param('chatId') chatId: string,
        @Request() req,
    ) {
        const userId = req.user.id;
        return await this.messageService.getMessages(chatId, userId);
    }

    @UseGuards(authGuard)
    @Get('messages/starred/:chatId')    
    async getStarredMessages(
        @Param('chatId') chatId: string,
        @Request() req,
    ) {
        const userId = req.user.id;
        return await this.messageService.getStarredMessages(chatId, userId);
    }

    @UseGuards(authGuard)
    @Post('messages/star')
    async starMessage(
        @Body() body: { messageId: string },
        @Request() req,
    ) {
        const userId = req.user.id;
        const { messageId } = body;
        if (!messageId) {
            throw new BadRequestException('MessageId is required');
        }
        return await this.messageService.starMessage(messageId, userId);
    }

    @UseGuards(authGuard)
    @Post('messages/unstar')
    async unstarMessage(
        @Body() body: { messageId: string },
        @Request() req,
    ) {
        const userId = req.user.id;
        const { messageId } = body;
        if (!messageId) {
            throw new BadRequestException('MessageId is required');
        }
        return await this.messageService.unstarMessage(messageId, userId);
    }

    @UseGuards(authGuard)
    @Delete('messages/:messageId')
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Request() req,
    ) {
        const userId = req.user.id;
        return await this.messageService.deleteMessage(messageId, userId);
    }

    @UseGuards(authGuard)
    @Post('messages/file-upload')
    async uploadFile(
        @Body() body: { file: Express.Multer.File ,chatId: string },
        @Request() req,
    ) {
        const userId = req.user.id;
        const { file,chatId } = body;
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return await this.messageService.sendFileMessage(userId,chatId , file);
    }
}