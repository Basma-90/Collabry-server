import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole, CollaborationStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CollaborationQueryDto {
  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
    example: '60d21b4667d0d8992e610c85',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Filter by publication ID',
    required: false,
    example: '60d21b4667d0d8992e610c86',
  })
  @IsOptional()
  @IsString()
  publicationId?: string;

  @ApiProperty({
    description: 'Filter by collaboration role',
    required: false,
    enum: CollaboratorRole,
  })
  @IsOptional()
  @IsEnum(CollaboratorRole)
  role?: CollaboratorRole;

  @ApiProperty({
    description: 'Filter by collaboration status',
    required: false,
    enum: CollaborationStatus,
  })
  @IsOptional()
  @IsEnum(CollaborationStatus)
  status?: CollaborationStatus;

  @ApiProperty({
    description: 'Number of records to skip',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiProperty({
    description: 'Number of records to take',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  take?: number = 10;
}
