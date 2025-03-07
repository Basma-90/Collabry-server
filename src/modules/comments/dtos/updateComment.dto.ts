import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated content of the comment',
    example: 'This publication is extremely valuable for my research!',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
