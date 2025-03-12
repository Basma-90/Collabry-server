import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ description: 'Token ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Token balance' })
  tokenBalance: number;

  @ApiProperty({ description: 'Reputation' })
  reputation: number;

  @ApiProperty({ description: 'Wallet address', nullable: true })
  walletAddress: string | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
