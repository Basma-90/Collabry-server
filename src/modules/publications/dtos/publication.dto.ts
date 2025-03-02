import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SectionType, Visibility, PublicationStatus } from '@prisma/client';

// export class ContentBlock {
//   @IsString()
//   @ApiProperty({
//     description: 'Type of content block',
//     enum: [
//       'heading1',
//       'heading2',
//       'paragraph',
//       'code',
//       'bold',
//       'list',
//       'image',
//     ],
//     example: 'paragraph',
//   })
//   type:
//     | 'heading1'
//     | 'heading2'
//     | 'paragraph'
//     | 'code'
//     | 'bold'
//     | 'list'
//     | 'image';

//   @IsString()
//   @ApiProperty({
//     description: 'Content text',
//     example: 'This is a paragraph of text content.',
//   })
//   content: string;
// }

export class SectionDto {
  @IsString()
  @ApiProperty({
    description: 'Title of the section',
    example: 'Research Methodology',
  })
  title: string;

  @IsString()
  @ApiProperty({
    description: 'Order index for sorting sections',
    example: '2',
  })
  orderIndex: string; // Keep as string in DTO definition

  @IsEnum(SectionType)
  @ApiProperty({
    description: 'Type of section',
    enum: SectionType,
    example: 'TEXT',
  })
  type: SectionType;

  @IsString()
  @ApiProperty({
    description: 'Content text',
    example: 'This is a paragraph of text content.',
  })
  content: string;

  @IsOptional()
  @ApiProperty({
    description: 'Array of files to be uploaded with this section',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  files?: any[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'ID of the publication this section belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  publicationId?: string;
}

export class CreatePublicationDto {
  @IsString()
  @ApiProperty({
    description: 'Title of the publication',
    example: 'Advanced Research on Machine Learning Applications',
  })
  title: string;

  @IsString()
  @ApiProperty({
    description: 'Abstract or summary of the publication',
    example:
      'This research explores new applications of machine learning in healthcare...',
  })
  abstract: string;

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => SectionDto)
  // @ApiProperty({
  //   description: 'Sections of the publication',
  //   type: [SectionDto],
  // })
  // sections: SectionDto[];

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Keywords related to the publication',
    example: ['machine learning', 'healthcare', 'neural networks'],
  })
  keywords?: string[];

  @IsString()
  @ApiProperty({
    description: 'Language of the publication',
    example: 'en',
  })
  language: string;

  @IsEnum(Visibility)
  @ApiProperty({
    description: 'Visibility level of the publication',
    enum: Visibility,
    example: 'PUBLIC',
  })
  visibility: Visibility;

  @IsString()
  @ApiProperty({
    description: 'ID of the category',
    example: '60d21b4667d0d8992e610c85',
  })
  categoryId: string;
}

export class UpdatePublicationDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated title of the publication',
    example: 'Revised: Advanced Research on Machine Learning Applications',
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated abstract of the publication',
    example:
      'This revised research explores new applications of machine learning...',
  })
  abstract?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated sections of the publication',
    type: [SectionDto],
  })
  sections?: SectionDto[];

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated keywords',
    example: ['machine learning', 'AI', 'healthcare', 'neural networks'],
  })
  keywords?: string[];

  @IsEnum(Visibility)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated visibility level',
    enum: Visibility,
    example: 'LIMITED',
  })
  visibility?: Visibility;

  @IsEnum(PublicationStatus)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Updated publication status',
    enum: PublicationStatus,
    example: 'PUBLISHED',
  })
  status?: PublicationStatus;
}

export class PublicationStatusDto {
  @IsEnum(PublicationStatus)
  @ApiProperty({
    description: 'Status of publication',
    enum: PublicationStatus,
    example: 'PUBLISHED',
  })
  type: PublicationStatus;
}

export class PublicationVisibilityDto {
  @IsEnum(Visibility)
  @ApiProperty({
    description: 'Visibility of publication',
    enum: Visibility,
    example: 'PUBLIC',
  })
  type: Visibility;
}

export class UpdateSectionDto {
  @IsString()
  @ApiProperty({
    description: 'Title of the section',
    example: 'Research Methodology',
  })
  title: string;

  @IsString()
  @ApiProperty({
    description: 'Order index for sorting sections',
    example: '2',
  })
  orderIndex: string; // Keep as string in DTO definition

  @IsEnum(SectionType)
  @ApiProperty({
    description: 'Type of section',
    enum: SectionType,
    example: 'TEXT',
  })
  type: SectionType;

  @IsString()
  @ApiProperty({
    description: 'Content text',
    example: 'This is a paragraph of text content.',
  })
  content: string;
}
