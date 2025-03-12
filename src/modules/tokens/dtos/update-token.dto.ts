import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTokenDto {
  @ApiPropertyOptional({ description: 'Token balance' })
  @IsNumber()
  @IsOptional()
  tokenBalance?: number;

  @ApiPropertyOptional({ description: 'Reputation' })
  @IsNumber()
  @IsOptional()
  reputation?: number;

  @ApiPropertyOptional({ description: 'Wallet address' })
  @IsString()
  @IsOptional()
  walletAddress?: string;
}
