import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the comment',
    example: '6406e4dcb32e3b0ee4f7dd58',
  })
  id: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a very insightful publication!',
  })
  content: string;

  @ApiProperty({
    description: 'ID of the user who authored the comment',
    example: '6406e4dcb32e3b0ee4f7dd59',
  })
  authorId: string;

  @ApiProperty({
    description: 'ID of the publication being commented on',
    example: '6406e4dcb32e3b0ee4f7dd56',
  })
  publicationId: string;

  @ApiPropertyOptional({
    description: 'ID of the parent comment if this is a reply',
    example: '6406e4dcb32e3b0ee4f7dd57',
  })
  parentId?: string;

  @ApiProperty({
    description: 'Array of reply comment IDs',
    type: [String],
    example: ['6406e4dcb32e3b0ee4f7dd60', '6406e4dcb32e3b0ee4f7dd61'],
  })
  replies: string[];

  @ApiProperty({
    description: 'Creation date of the comment',
    example: '2023-03-07T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the comment',
    example: '2023-03-07T14:30:00Z',
  })
  updatedAt: Date;
}
