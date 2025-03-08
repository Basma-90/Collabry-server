import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole, CollaborationStatus } from '@prisma/client';

class UserSummaryDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email: string;
}

class PublicationSummaryDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c86' })
  id: string;

  @ApiProperty({ example: 'Emerging Patterns in Quantum Computing' })
  title: string;

  @ApiProperty({
    example: 'This research explores novel approaches to quantum algorithms...',
  })
  abstract: string;
}

export class CollaborationResponseDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c87' })
  id: string;

  @ApiProperty({ enum: CollaboratorRole, example: CollaboratorRole.EDITOR })
  role: CollaboratorRole;

  @ApiProperty({
    enum: CollaborationStatus,
    example: CollaborationStatus.PENDING,
  })
  status: CollaborationStatus;

  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;

  @ApiProperty({ type: PublicationSummaryDto })
  publication: PublicationSummaryDto;

  @ApiProperty({ example: '2023-01-15T14:30:45.123Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-15T14:30:45.123Z' })
  updatedAt: Date;
}
