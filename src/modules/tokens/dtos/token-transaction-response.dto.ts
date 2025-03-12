import { ApiProperty } from '@nestjs/swagger';

class UserInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;
}

export class TokenTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Sender user ID' })
  senderId: string;

  @ApiProperty({ description: 'Recipient user ID' })
  recipientId: string;

  @ApiProperty({ description: 'Token ID' })
  tokenId: string;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Transaction timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Sender information', type: UserInfoDto })
  sender?: UserInfoDto;

  @ApiProperty({ description: 'Recipient information', type: UserInfoDto })
  recipient?: UserInfoDto;
}
