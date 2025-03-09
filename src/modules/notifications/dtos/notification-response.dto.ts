import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'The notification ID',
    example: '60d21b4667d0d8992e610c85',
  })
  id: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of the notification',
    example: 'COMMENT',
  })
  type: NotificationType;

  @ApiProperty({
    description: 'The notification message',
    example: 'Someone commented on your post',
  })
  message: string;

  @ApiProperty({
    description: 'Whether the notification is read or not',
    example: false,
  })
  read: boolean;

  @ApiProperty({
    description: 'Whether the notification is important or not',
    example: false,
  })
  important: boolean;

  @ApiPropertyOptional({
    description: 'ID of the referenced entity (project, comment, etc.)',
    example: '60d21b4667d0d8992e610c86',
  })
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Type of the referenced entity',
    example: 'COMMENT',
  })
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: {
      postTitle: 'My First Post',
      commentId: '60d21b4667d0d8992e610c87',
    },
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Expiration date for temporary notifications',
    example: '2023-12-31T23:59:59Z',
  })
  expiresAt?: string;

  @ApiProperty({
    description: 'User ID who received the notification',
    example: '60d21b4667d0d8992e610c85',
  })
  userId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-15T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-15T12:00:00Z',
  })
  updatedAt: Date;
}
