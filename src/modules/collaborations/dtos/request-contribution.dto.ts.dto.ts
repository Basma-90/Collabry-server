import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestContributionDto {
  @ApiProperty({
    description: 'The role requested by the contributor',
    enum: CollaboratorRole,
    example: CollaboratorRole.REVIEWER,
  })
  @IsEnum(CollaboratorRole)
  @IsNotEmpty()
  role: CollaboratorRole;

  @ApiProperty({
    description: 'Message explaining why the user wants to contribute',
    example: 'I have expertise in this area and would like to contribute...',
  })
  @IsString()
  @IsOptional()
  message?: string;
}
