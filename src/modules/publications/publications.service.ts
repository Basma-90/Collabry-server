import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePublicationDto, SectionDto } from './dtos/publication.dto';
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
}
