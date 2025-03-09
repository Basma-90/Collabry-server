import {
  ConflictException,
  Injectable,
  NotFoundException,
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

  async getSinglePublication(userId: string, publicationId: string) {
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
      throw new UnauthorizedException(
        'You do not have access to this publication',
      );
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
          orderBy: {
            orderIndex: 'asc', // Order sections by their index
          },
        },
        category: true,
        author: {
          select: {
            email: true,
            name: true,
            id: true,
          },
        },
        collaborations: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                email: true,
                name: true,
                role: true,
                id: true,
              },
            },
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const collaborators = publication.collaborations
      .filter((collab) => collab.status === 'ACCEPTED')
      .map((collab) => ({
        id: collab.id,
        user: collab.user,
        status: collab.status,
      }));

    return {
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
      visibility: publication.visibility,
      status: publication.status,
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
      categoryName: publication.category.name,
      categoryId: publication.category.id,
      authorName: publication.author.name,
      authorEmail: publication.author.email,
      authorId: publication.author.id,
      collaborators: collaborators,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }

  async getAllPublicationsForUser(userId: string) {
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
    const publications = await this.prisma.publication.findMany({
      where: {
        authorId: userId,
      },
      include: {
        category: true,
      },
    });
    return publications.map((publication) => ({
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
      visibility: publication.visibility,
      status: publication.status,
      categoryName: publication.category.name,
      categoryId: publication.category.id,
      createdAt: publication.createdAt,
    }));
  }

  async changePublication(
    userId: string,
    publicationId: string,
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
    const publication = await this.prisma.publication.findUnique({
      where: {
        id: publicationId,
      },
      select: {
        authorId: true,
      },
    });
    if (!publication || publication.authorId !== userId) {
      throw new UnauthorizedException();
    }
    await this.prisma.publication.update({
      where: {
        id: publicationId,
      },
      data: {
        title: createPublicationDto.title,
        abstract: createPublicationDto.abstract,
        keywords: createPublicationDto.keywords,
        language: createPublicationDto.language,
        visibility: createPublicationDto.visibility,
      },
    });
    return 'Publication updated successfully';
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

  // ------------------------------------------------
  async getSingleSection(userId: string, sectionId: string) {
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
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        files: true,
        publication: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    if (
      !user.publications.find(
        (publication) => publication.id === section.publicationId,
      )
    ) {
      throw new UnauthorizedException();
    }
    return {
      id: section.id,
      title: section.title,
      orderIndex: section.orderIndex,
      type: section.type,
      content: section.content,
      publicationId: section.publicationId,
      publicationTitle: section.publication.title,
      files: section.files.map((file) => ({
        id: file.id,
        url: file.url,
      })),
    };
  }

  async updateSection(
    userId: string,
    sectionId: string,
    sectionDto: SectionDto,
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
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        publication: {
          select: {
            authorId: true,
          },
        },
      },
    });
    if (!section || section.publication.authorId !== userId) {
      throw new UnauthorizedException();
    }
    await this.prisma.section.update({
      where: {
        id: sectionId,
      },
      data: {
        title: sectionDto.title,
        orderIndex: parseInt(sectionDto.orderIndex),
        type: sectionDto.type,
        content: sectionDto.content,
      },
    });
    return 'Section updated successfully';
  }

  async addSectionFile(
    userId: string,
    sectionId: string,
    file: Express.Multer.File,
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
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        publication: {
          select: {
            authorId: true,
          },
        },
      },
    });
    if (!section || section.publication.authorId !== userId) {
      throw new UnauthorizedException();
    }
    if (file) {
      const buffer = await this.cloudinaryService.uploadFile(file);
      if (buffer) {
        await this.prisma.sectionFile.create({
          data: {
            url: buffer.url,
            publicId: buffer.public_id,
            section: {
              connect: {
                id: sectionId,
              },
            },
          },
        });
        return 'File added successfully';
      } else {
        throw new ConflictException('Failed to upload file');
      }
    } else {
      throw new ConflictException('File not found');
    }
  }

  async deleteSectionFile(userId: string, fileId: string) {
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
    const file = await this.prisma.sectionFile.findUnique({
      where: {
        id: fileId,
      },
      include: {
        section: {
          include: {
            publication: {
              select: {
                authorId: true,
              },
            },
          },
        },
      },
    });
    if (!file || file.section.publication.authorId !== userId) {
      throw new UnauthorizedException();
    }
    await this.cloudinaryService.deleteFile(file.publicId);
    await this.prisma.sectionFile.delete({
      where: {
        id: fileId,
      },
    });
    return 'File deleted successfully';
  }

  async getAllPublications() {
    const publications = await this.prisma.publication.findMany({
      where: {
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        author: true,
        sections: {
          include: {
            files: true,
          },
        },
      },
    });

    return publications.map((publication) => ({
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
      visibility: publication.visibility,
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
      categoryName: publication.category.name,
      categoryId: publication.category.id,
      authorName: publication.author.email,
      authorId: publication.author.id,
      createdAt: publication.createdAt,
    }));
  }

  async getPublication(publicationId: string) {
    const publication = await this.prisma.publication.findUnique({
      where: {
        id: publicationId,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      },
      include: {
        sections: {
          include: {
            files: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
        category: true,
        author: {
          select: {
            email: true,
            name: true,
            id: true,
          },
        },
        collaborations: {
          where: {
            status: 'ACCEPTED',
          },
          select: {
            id: true,
            status: true,
            user: {
              select: {
                email: true,
                name: true,
                role: true,
                id: true,
              },
            },
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found or not accessible');
    }

    const collaborators = publication.collaborations.map((collab) => ({
      id: collab.id,
      user: collab.user,
      status: collab.status,
    }));

    return {
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
      visibility: publication.visibility,
      status: publication.status,
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
      categoryName: publication.category.name,
      categoryId: publication.category.id,
      authorName: publication.author.name,
      authorEmail: publication.author.email,
      authorId: publication.author.id,
      collaborators: collaborators,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }
}
