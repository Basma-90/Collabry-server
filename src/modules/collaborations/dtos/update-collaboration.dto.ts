import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole, CollaborationStatus } from '@prisma/client';

export class UpdateCollaborationDto {
  @ApiProperty({
    description: 'Updated role of the collaborator',
    enum: CollaboratorRole,
    required: false,
    example: CollaboratorRole.REVIEWER,
  })
  @IsOptional()
  @IsEnum(CollaboratorRole)
  role?: CollaboratorRole;

  @ApiProperty({
    description: 'Updated status of the collaboration',
    enum: CollaborationStatus,
    required: false,
    example: CollaborationStatus.ACCEPTED,
  })
  @IsOptional()
  @IsEnum(CollaborationStatus)
  status?: CollaborationStatus;
}
