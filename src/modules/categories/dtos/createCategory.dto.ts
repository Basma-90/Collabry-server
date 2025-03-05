import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @ApiProperty({
    description: 'Name of the category',
    example: 'Electronics',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: 'Description of the category',
    example: 'Electronics are devices that can be used for various purposes',
  })
  description: string;

  @ApiProperty({
    description: 'Parent category id',
    example: '5f7f7d9a-8a5e-4d4b-8c2b-2b0e1c3d6e6d',
  })
  parentId?: string;
}
