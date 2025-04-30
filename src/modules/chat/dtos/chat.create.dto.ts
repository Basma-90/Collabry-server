enum ChatType {
    GROUP = 'group',
    DIRECT = 'direct',
    CHANNEL = 'channel',
}

export class createGroupChatDto {
    name: string;
    userId: string;
}
export class createDirectChatDto {
    participantId: string;
    userId: string;
}
export class addParticipantsDto {
    chatId: string;
    userId:string;
    participantId:string;
}
export class getChatMessagesDto {
    chatId: string;
    userId: string;
}
export class acceptJoinRequestDto {
    chatId: string;
    userId: string;
    participantId: string;
}

export class rejectJoinRequestDto {
    chatId: string;
    userId: string;
    participantId: string;
}

export class leaveChatDto {
    chatId: string;
    userId: string;
}

export class deleteChatDto {
    chatId: string;
    userId: string;
}
