import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class TokenTransactionDto {
  @ApiProperty({ description: 'Sender user ID' })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ description: 'Amount of tokens to transfer' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
