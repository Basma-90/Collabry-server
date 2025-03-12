import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class TransferTokensDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'Amount of tokens to transfer' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
