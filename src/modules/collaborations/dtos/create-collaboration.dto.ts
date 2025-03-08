import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole, CollaborationStatus } from '@prisma/client';

export class CreateCollaborationDto {
  @ApiProperty({
    description: 'The role of the collaborator',
    enum: CollaboratorRole,
    example: CollaboratorRole.EDITOR,
  })
  @IsNotEmpty()
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;

  @ApiProperty({
    description: 'User ID to invite as collaborator',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'ID of the publication for collaboration',
    example: '60d21b4667d0d8992e610c86',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  publicationId: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  message: string;
}
