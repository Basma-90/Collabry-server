import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    description: 'Type of the notification',
    example: 'COMMENT',
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'The notification message',
    example: 'Someone commented on your post',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'User ID who will receive the notification',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Whether the notification is read or not',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the notification is important or not',
    default: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  important?: boolean;

  @ApiPropertyOptional({
    description: 'ID of the referenced entity (project, comment, etc.)',
    example: '60d21b4667d0d8992e610c86',
  })
  @IsMongoId()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Type of the referenced entity',
    example: 'COMMENT',
  })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: {
      postTitle: 'My First Post',
      commentId: '60d21b4667d0d8992e610c87',
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Expiration date for temporary notifications',
    example: '2023-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
