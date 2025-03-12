import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsEthereumAddress,
  IsMongoId,
} from 'class-validator';

export class CreateTokenDto {
  @ApiPropertyOptional({ description: 'User ID (required for admin)' })
  @IsString()
  @IsMongoId()
  @IsOptional()
  userId?: string;

  // @ApiPropertyOptional({
  //   description: 'Initial token balance',
  //   default: 100
  // })
  // @IsNumber()
  // @IsOptional()
  // tokenBalance?: number;

  // @ApiPropertyOptional({
  //   description: 'Initial reputation',
  //   default: 10
  // })
  // @IsNumber()
  // @IsOptional()
  // reputation?: number;

  @ApiPropertyOptional({
    description: 'Wallet address (will be auto-generated if not provided)',
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  })
  @IsEthereumAddress()
  @IsOptional()
  walletAddress?: string;
}
