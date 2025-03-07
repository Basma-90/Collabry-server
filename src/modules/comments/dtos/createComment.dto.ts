import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a very insightful publication!',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'ID of the publication being commented on',
    example: '6406e4dcb32e3b0ee4f7dd56',
  })
  @IsNotEmpty()
  @IsMongoId()
  publicationId: string;

  @ApiPropertyOptional({
    description: 'ID of the parent comment if this is a reply',
    example: '6406e4dcb32e3b0ee4f7dd57',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
