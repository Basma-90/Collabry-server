import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CollaboratorUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiPropertyOptional({ description: 'User profile image URL' })
  profileImageUrl: string | null;
}

export class CollaboratorBaseDto {
  @ApiProperty({ description: 'Collaboration ID' })
  id: string;

  @ApiProperty({
    description: 'Collaborator user information',
    type: CollaboratorUserDto,
  })
  user: CollaboratorUserDto;
}

export class CollaboratorWithStatusDto extends CollaboratorBaseDto {
  @ApiProperty({
    description: 'Collaboration status',
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
  })
  status: string;
}

export class SectionFileDto {
  @ApiProperty({ description: 'File ID' })
  id: string;

  @ApiProperty({ description: 'File URL' })
  url: string;
}

export class SectionDto {
  @ApiProperty({ description: 'Section ID' })
  id: string;

  @ApiProperty({ description: 'Section title' })
  title: string;

  @ApiProperty({ description: 'Section order index' })
  orderIndex: number;

  @ApiProperty({
    description: 'Section type',
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'CODE'],
  })
  type: string;

  @ApiProperty({ description: 'Section content' })
  content: string;

  @ApiProperty({ description: 'Section files', type: [SectionFileDto] })
  files: SectionFileDto[];
}

export class PublicationBaseResponseDto {
  @ApiProperty({ description: 'Publication ID' })
  id: string;

  @ApiProperty({ description: 'Publication title' })
  title: string;

  @ApiProperty({ description: 'Publication abstract' })
  abstract: string;

  @ApiProperty({ description: 'Publication keywords' })
  keywords: string[];

  @ApiProperty({ description: 'Publication language' })
  language: string;

  @ApiProperty({
    description: 'Publication visibility',
    enum: ['PUBLIC', 'PRIVATE'],
  })
  visibility: string;

  @ApiProperty({
    description: 'Publication status',
    enum: ['DRAFT', 'PUBLISHED'],
  })
  status: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Author name' })
  authorName: string;

  @ApiProperty({ description: 'Author ID' })
  authorId: string;

  @ApiPropertyOptional({ description: 'Author avatar URL' })
  authorAvatar: string | null;

  @ApiProperty({
    description: 'Publication collaborators',
    type: [CollaboratorBaseDto],
  })
  collaborators: CollaboratorBaseDto[];

  @ApiProperty({ description: 'Publication creation date', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'Publication last update date', type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Whether the current user has liked this publication',
  })
  isLiked?: boolean;
}

export class PublicationListResponseDto extends PublicationBaseResponseDto {}

export class PublicationDetailResponseDto extends PublicationBaseResponseDto {
  @ApiProperty({ description: 'Publication sections', type: [SectionDto] })
  sections: SectionDto[];

  @ApiPropertyOptional({ description: 'Author email' })
  authorEmail?: string;
}
