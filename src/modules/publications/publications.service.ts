import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreatePublicationDto,
  PublicationStatusDto,
  PublicationVisibilityDto,
  SectionDto,
} from './dtos/publication.dto';
import { CloudinaryService } from 'src/storage/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async createPublication(
    userId: string,
    createPublicationDto: CreatePublicationDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const category = await this.prisma.category.findUnique({
      where: {
        id: createPublicationDto.categoryId,
      },
    });
    if (!category) {
      throw new UnauthorizedException();
    }
    await this.prisma.publication.create({
      data: {
        title: createPublicationDto.title,
        abstract: createPublicationDto.abstract,
        keywords: createPublicationDto.keywords,
        language: createPublicationDto.language,
        visibility: createPublicationDto.visibility,
        authorId: userId,
        categoryId: createPublicationDto.categoryId,
      },
    });
    return 'Publication created successfully';
  }

  async createSection(
    userId: string,
    sectionDto: SectionDto,
    files: Array<Express.Multer.File>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        publications: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const publication = await this.prisma.publication.findUnique({
      where: {
        id: sectionDto.publicationId,
      },
      select: {
        authorId: true,
        sections: true,
      },
    });

    if (!publication || publication.authorId !== userId) {
      throw new UnauthorizedException();
    }

    // Check if a section with the same orderIndex already exists
    const existingSectionWithSameOrder = publication.sections.find(
      (section) => section.orderIndex === parseInt(sectionDto.orderIndex),
    );

    if (existingSectionWithSameOrder) {
      throw new ConflictException(
        `A section with order index ${sectionDto.orderIndex} already exists in this publication`,
      );
    }

    // Create the new section
    const section = await this.prisma.section.create({
      data: {
        title: sectionDto.title,
        orderIndex: parseInt(sectionDto.orderIndex),
        type: sectionDto.type,
        content: sectionDto.content,
        publication: {
          connect: {
            id: sectionDto.publicationId,
          },
        },
      },
    });

    if (files && files.length > 0) {
      const buffers = await this.cloudinaryService.uploadFiles(files);
      if (buffers) {
        await Promise.all(
          buffers.map(async (buffer) => {
            await this.prisma.sectionFile.create({
              data: {
                url: buffer.url,
                publicId: buffer.public_id,
                section: {
                  connect: {
                    id: section.id,
                  },
                },
              },
            });
          }),
        );
      }
    }

    return 'section cerated successfully';
  }

  async getPublication(userId: string, publicationId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        publications: true,
      },
    });

    if (
      !user ||
      !user.publications.find((publication) => publication.id === publicationId)
    ) {
      throw new UnauthorizedException();
    }
    const publication = await this.prisma.publication.findUnique({
      where: {
        id: publicationId,
      },
      include: {
        sections: {
          include: {
            files: true,
          },
        },
        category: true,
      },
    });

    return {
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
      visibility: publication.visibility,
      status: publication.status,
      views: publication.views,
      citations: publication.citations,
      categoryName: publication.category.name,
      categoryId: publication.category.id,
      sections: publication.sections.map((section) => ({
        id: section.id,
        title: section.title,
        orderIndex: section.orderIndex,
        type: section.type,
        content: section.content,
        files: section.files.map((file) => ({
          id: file.id,
          url: file.url,
        })),
      })),
      createdAt: publication.createdAt,
    };
  }

  async changePublicationStatus(
    userId: string,
    publicationId: string,
    status: PublicationStatusDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        publications: true,
      },
    });

    if (
      !user ||
      !user.publications.find((publication) => publication.id === publicationId)
    ) {
      throw new UnauthorizedException();
    }

    await this.prisma.publication.update({
      where: {
        id: publicationId,
      },
      data: {
        status: status.type,
      },
    });

    return 'Publication status changed successfully';
  }

  async changePublicationVisibility(
    userId: string,
    publicationId: string,
    visibility: PublicationVisibilityDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        publications: true,
      },
    });
    if (
      !user ||
      !user.publications.find((publication) => publication.id === publicationId)
    ) {
      throw new UnauthorizedException();
    }
    await this.prisma.publication.update({
      where: {
        id: publicationId,
      },
      data: {
        visibility: visibility.type,
      },
    });
    return 'Publication visibility changed successfully';
  }
}
