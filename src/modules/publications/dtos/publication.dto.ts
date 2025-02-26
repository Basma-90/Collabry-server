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
import { ApiConsumes, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class PublicationResponseDto {
  @ApiProperty({
    description: 'Publication ID',
    example: '60d21b4667d0d8992e610c85',
  })
  id: string;

  @ApiProperty({
    description: 'Publication title',
    example: 'Advanced Research on Machine Learning Applications',
  })
  title: string;

  @ApiProperty({
    description: 'Publication abstract',
    example:
      'This research explores new applications of machine learning in healthcare...',
  })
  abstract: string;

  @ApiProperty({
    description: 'Publication sections',
    type: [SectionDto],
  })
  sections: SectionDto[];

  // @ApiProperty({
  //   description: 'Files attached to the publication',
  //   type: [FileDto],
  // })
  // files: FileDto[];

  @ApiProperty({
    description: 'Publication keywords',
    example: ['machine learning', 'healthcare', 'neural networks'],
  })
  keywords: string[];

  @ApiProperty({
    description: 'Publication language',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'Publication status',
    enum: PublicationStatus,
    example: 'PUBLISHED',
  })
  status: PublicationStatus;

  @ApiProperty({
    description: 'Publication visibility',
    enum: Visibility,
    example: 'PUBLIC',
  })
  visibility: Visibility;

  @ApiProperty({
    description: 'View count',
    example: 1250,
  })
  views: number;

  @ApiProperty({
    description: 'Citation count',
    example: 25,
  })
  citations: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-05-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-05-20T14:45:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Author information',
    example: {
      id: '60d21b4667d0d8992e610c80',
      email: 'researcher@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Smith',
      },
    },
  })
  author: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };

  @ApiProperty({
    description: 'Category information',
    example: {
      id: '60d21b4667d0d8992e610c90',
      name: 'Computer Science',
    },
  })
  category: {
    id: string;
    name: string;
  };
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'URL to access the uploaded file',
    example: 'https://cloudinary.com/example/file.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'research_data.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  size: number;
}

export class AddSectionDto {
  @ApiProperty({
    description: 'Section to add to the publication',
    type: SectionDto,
  })
  section: SectionDto;
}

export class ReorderSectionsDto {
  @ApiProperty({
    description: 'Ordered array of section IDs',
    example: ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'],
  })
  sectionIds: string[];
}
