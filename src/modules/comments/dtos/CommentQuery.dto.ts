import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
export class CommentQueryDto {
  @ApiPropertyOptional({
    description: 'Filter comments by publication ID',
    example: '6406e4dcb32e3b0ee4f7dd56',
  })
  @IsOptional()
  @IsMongoId()
  publicationId?: string;

  @ApiPropertyOptional({
    description: 'Filter comments by parent comment ID (for replies)',
    example: '6406e4dcb32e3b0ee4f7dd57',
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Filter comments by author ID',
    example: '6406e4dcb32e3b0ee4f7dd59',
  })
  @IsOptional()
  @IsMongoId()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Number of records to skip (for pagination)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number) // This is important to transform string to number
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of records to take (for pagination)',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number) // This is important to transform string to number
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number = 10;
}
