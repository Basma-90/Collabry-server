import { Injectable, BadRequestException, HttpExceptionBodyMessage } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProfilesService } from "../profiles/profiles.service";

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService, private readonly profileService: ProfilesService) { }

    async createGroupChat(userId: string, name: string) {
        const userProfile = await this.profileService.getProfile(userId);
        if (!userProfile) {
            throw new BadRequestException('User not found');
        }
        const chat = await this.prisma.chat.create({
            data: {
                type: 'GROUP',
                name: name,
                participants: {
                    create: {
                        userId: userId,
                        role: 'ADMIN',
                    }
                }
            }
        });
        return chat;
    }

    async addParticipantToGroupChat(userId: string, chatId: string, participantId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                participants: true,
            }
        });
        if (!chat) {
            throw new BadRequestException('Chat not found');
        }
        const participant = await this.prisma.chatParticipant.findFirst({
            where: {
                userId: userId,
                chatId: chatId,
            }
        })
        if (!participant) {
            throw new BadRequestException('User is not a participant');
        }
        if (participant.role !== 'ADMIN') {
            throw new BadRequestException('User is not an admin');
        }
        const newParticipant = await this.prisma.chatParticipant.create({
            data: {
                userId: participantId,
                chatId: chatId,
                role: 'MEMBER',
            }
        });
        return newParticipant;
    }

    async getChatById(userId: string, chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                participants: {
                    where: {
                        userId: userId,
                    },
                    select: {
                        role: true,
                    }
                },
                messages: true,

            }
        });
        const chatDeletion = await this.prisma.chatDeletion.findFirst({
            where: {
                chatId: chatId,
                userId: userId,
            }
        })
        if (!chat) {
            throw new BadRequestException('Chat not found');
        }
        if (chatDeletion) {
            throw new BadRequestException('Chat has been deleted by user');
        }

        return chat;
    }

    async getUserChats(userId: string) {
        const chats = await this.prisma.chat.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId,
                    }
                },
                deletions: {
                    none: {
                        userId: userId,
                    }
                }
            },
            include: {
                participants: true,
                messages: true,
            }
        });
        return chats;
    }

    async getChatMessages(userId: string, chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                messages: true,
            }
        });
        const chatDeletion = await this.prisma.chatDeletion.findFirst({
            where: {
                chatId: chatId,
                userId: userId,
            }
        })
        if (!chat) {
            throw new BadRequestException('Chat not found');
        }
        if (chatDeletion) {
            throw new BadRequestException('Chat has been deleted by user');
        }
        return chat.messages;
    }

    async requestJoinChat(userId: string, chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                participants: true,
            }
        })

        if (!chat) {
            throw new BadRequestException('Chat not found');
        }

        const isParticipant = chat.participants.some((participant) => participant.userId === userId);
        if (isParticipant) {
            throw new BadRequestException('User is already a participant');
        }

        const joinRequest = await this.prisma.chatJoinRequest.create({
            data: {
                userId: userId,
                chatId: chatId,
            }
        });

        return joinRequest;
    }

    async acceptJoinRequest(userId: string, chatId: string, requestId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                participants: true,
            }
        });

        if (!chat) {
            throw new BadRequestException('Chat not found');
        }

        const isParticipant = chat.participants.some((participant) => participant.userId === userId);
        if (isParticipant) {
            throw new BadRequestException('User is already a participant');
        }

        const joinRequest = await this.prisma.chatJoinRequest.findUnique({
            where: {
                id: requestId,
            }
        });

        if (!joinRequest) {
            throw new BadRequestException('Join request not found');
        }

        await this.prisma.chatJoinRequest.delete({
            where: {
                id: requestId,
            }
        });

        await this.prisma.chatParticipant.create({
            data: {
                userId: joinRequest.userId,
                chatId: chatId,
                role: 'MEMBER',
            }
        });

    }

    async rejectJoinRequest(userId: string, chatId: string, requestId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId
            }
        })
        if (!chat) {
            throw new BadRequestException('No Chat Exists');
        }
        const joinRequest = await this.prisma.chatJoinRequest.findUnique({
            where: {
                id: requestId
            }
        })
        if (!joinRequest) {
            throw new BadRequestException('No request was sent');
        }

    }

    async leaveChat(userId: string, chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId
            }
        })
        if (!chat) {
            throw new BadRequestException('no chat exists');
        }
        const participant = await this.prisma.chatParticipant.findFirst({
            where: {
                userId: userId,
                chatId: chatId,
            },
        });

        if (!participant) {
            throw new BadRequestException('User is not a participant');
        }
        if (participant.role === 'ADMIN') {
            throw new BadRequestException('Admin cannot leave the chat');
        }
        await this.prisma.chatParticipant.delete({
            where: {
                id: participant.id,
            }
        });
    }

    async deleteCopyOfChat(userId: string, chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
            include: {
                participants: true,
            }
        })
        if (!chat) {
            throw new BadRequestException('No chat exists');
        }
        const participant = await this.prisma.chatParticipant.findFirst({
            where: {
                userId: userId,
                chatId: chatId,
            }
        })
        if (!participant) {
            throw new BadRequestException('User is not a participant');
        }
        const deletion = await this.prisma.chatDeletion.findMany({
            where: {
                chatId: chatId
            }
        });
        const chatDeletion = await this.prisma.chatDeletion.findFirst({
            where: {
                chatId: chatId,
                userId: userId,
            }
        })
        if (chatDeletion) {
            if (deletion.length === chat.participants.length) {
                await this.prisma.chat.delete({
                    where: { id: chatId },
                });
            }
        } else {
            await this.prisma.chatDeletion.create({
                data: {
                    chatId,
                    userId,
                },
            });
        }
    }
    async deleteGroupChat(userId: string, chatId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id: chatId,
            }
        })
        if (!chat) {
            throw new BadRequestException('No chat exists');
        }
        const participant = await this.prisma.chatParticipant.findFirst({
            where: {
                userId: userId,
                chatId: chatId,
            }
        })
        if (!participant) {
            throw new BadRequestException('User is not a participant');
        }
        if (participant.role !== 'ADMIN') {
            throw new BadRequestException('User is not an admin');
        }
        await this.prisma.chat.delete({
            where: {
                id: chatId,
            }
        });
    }
    async createPrivateChat(userId: string, participantId: string) {
        const userProfile = await this.prisma.profile.findUnique({
            where: {
                id: userId,
            }
        });
        const participantProfile = await this.prisma.profile.findUnique({
            where: {
                id: participantId,
            }
        });
        if (!userProfile || !participantProfile) {
            throw new BadRequestException('User not found');
        }

        const chat = await this.prisma.chat.create({
            data: {
                type: 'DIRECT',
                participants: {
                    create: [
                        {
                            userId: userId,
                            role: 'MEMBER',
                        },
                        {
                            userId: participantId,
                            role: 'MEMBER',
                        }
                    ]
                }

            }
        });
        return chat;
    }
}