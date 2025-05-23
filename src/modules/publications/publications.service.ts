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
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';

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
      throw new UnauthorizedException('User not found');
    }
    const category = await this.prisma.category.findUnique({
      where: {
        id: createPublicationDto.categoryId,
      },
    });
    if (!category) {
      throw new UnauthorizedException('Category not found');
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
    const publication = await this.prisma.publication.findUnique({
      where: {
        id: publicationId,
      },
      include: {
        author: {
          include: {
            profile: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
        collaborations: {
          select: {
            id: true,
            status: true,
            userId: true,
            user: {
              select: {
                email: true,
                name: true,
                role: true,
                id: true,
                profile: {
                  select: {
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
        },
        sections: {
          include: {
            files: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
        category: true,
        likes: {
          where: {
            userId: userId,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const isOwner = publication.authorId === userId;
    const isCollaborator = publication.collaborations.some(
      (collab) => collab.userId === userId && collab.status === 'ACCEPTED',
    );

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have access to this publication',
      );
    }

    return this.mapPublicationToResponse(publication, {
      userId,
      includeDetails: true,
      includeCollaborationStatus: true,
    });
  }

  async getPublicPublication(publicationId: string, userId?: string) {
    const publication = await this.prisma.publication.findUnique({
      where: {
        id: publicationId,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        author: {
          include: {
            profile: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
        sections: {
          include: {
            files: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
        likes: userId
          ? {
              where: {
                userId: userId,
              },
            }
          : false,
        collaborations: {
          where: {
            status: 'ACCEPTED',
          },
          select: {
            id: true,
            status: true,
            user: {
              select: {
                profile: {
                  select: {
                    profileImageUrl: true,
                  },
                },
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

    return this.mapPublicationToResponse(publication, {
      userId,
      includeDetails: true,
    });
  }

  async getAllPublicationsForUser(userId: string) {
    const authoredPublications = await this.prisma.publication.findMany({
      where: {
        authorId: userId,
      },
      include: {
        category: true,
        author: {
          include: {
            profile: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
        likes: {
          where: {
            userId: userId,
          },
        },
      },
    });

    const collaboratedPublications = await this.prisma.publication.findMany({
      where: {
        collaborations: {
          some: {
            userId: userId,
            status: 'ACCEPTED',
          },
        },
      },
      include: {
        category: true,
        author: {
          include: {
            profile: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
        likes: {
          where: {
            userId: userId,
          },
        },
      },
    });

    const allPublicationIds = new Set();
    const allPublications = [];

    [...authoredPublications, ...collaboratedPublications].forEach(
      (publication) => {
        if (!allPublicationIds.has(publication.id)) {
          allPublicationIds.add(publication.id);
          allPublications.push(publication);
        }
      },
    );

    return allPublications.map((publication) =>
      this.mapPublicationToResponse(publication, { userId }),
    );
  }

  async getPublicPublications(userId?: string) {
    try {
      const publications = await this.prisma.publication.findMany({
        where: {
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          author: {
            id: { not: undefined },
          },
        },
        include: {
          category: true,
          author: {
            include: {
              profile: {
                select: {
                  profileImageUrl: true,
                },
              },
            },
          },
          sections: {
            include: {
              files: true,
            },
          },
          likes: userId
            ? {
                where: {
                  userId: userId,
                },
              }
            : false,
          collaborations: {
            where: {
              status: 'ACCEPTED',
            },
            select: {
              id: true,
              status: true,
              user: {
                select: {
                  profile: {
                    select: {
                      profileImageUrl: true,
                    },
                  },
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

      return publications.map((publication) =>
        this.mapPublicationToResponse(publication, { userId }),
      );
    } catch (error) {
      console.error('Error fetching publications:', error);
      return [];
    }
  }

  async changePublication(
    userId: string,
    publicationId: string,
    createPublicationDto: CreatePublicationDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        collaborations: {
          where: {
            userId: userId,
            status: 'ACCEPTED',
            role: { in: ['AUTHOR', 'EDITOR'] },
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const isOwner = publication.authorId === userId;
    const isCollaborator = publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to modify this publication',
      );
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
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const publication = await this.prisma.publication.findUnique({
      where: { id: sectionDto.publicationId },
      include: {
        sections: true,
        collaborations: {
          where: {
            userId: userId,
            status: 'ACCEPTED',
            role: { in: ['AUTHOR', 'EDITOR'] },
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const isOwner = publication.authorId === userId;
    const isCollaborator = publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to add sections to this publication',
      );
    }

    const existingSectionWithSameOrder = publication.sections.find(
      (section) => section.orderIndex === parseInt(sectionDto.orderIndex),
    );

    if (existingSectionWithSameOrder) {
      throw new ConflictException(
        `A section with order index ${sectionDto.orderIndex} already exists in this publication`,
      );
    }

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

    return 'Section created successfully';
  }

  async changePublicationStatus(
    userId: string,
    publicationId: string,
    status: PublicationStatusDto,
  ) {
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        collaborations: {
          where: {
            userId: userId,
            status: 'ACCEPTED',
            role: { in: ['AUTHOR', 'EDITOR'] },
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const isOwner = publication.authorId === userId;
    const isCollaborator = publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to change the status of this publication',
      );
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
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        collaborations: {
          where: {
            userId: userId,
            status: 'ACCEPTED',
            role: { in: ['AUTHOR', 'EDITOR'] },
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const isOwner = publication.authorId === userId;
    const isCollaborator = publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to change the visibility of this publication',
      );
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

  async getSingleSection(userId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        files: true,
        publication: {
          include: {
            collaborations: {
              where: {
                userId: userId,
                status: 'ACCEPTED',
              },
              select: {
                role: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const isOwner = section.publication.authorId === userId;
    const isCollaborator = section.publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException('You do not have access to this section');
    }

    return {
      id: section.id,
      title: section.title,
      orderIndex: section.orderIndex,
      type: section.type,
      content: section.content,
      publicationId: section.publication.id,
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
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        publication: {
          include: {
            collaborations: {
              where: {
                userId: userId,
                status: 'ACCEPTED',
                role: { in: ['AUTHOR', 'EDITOR'] },
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const isOwner = section.publication.authorId === userId;
    const isCollaborator = section.publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to modify this section',
      );
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
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        publication: {
          include: {
            collaborations: {
              where: {
                userId: userId,
                status: 'ACCEPTED',
                role: { in: ['AUTHOR', 'EDITOR'] },
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const isOwner = section.publication.authorId === userId;
    const isCollaborator = section.publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to add files to this section',
      );
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
    const file = await this.prisma.sectionFile.findUnique({
      where: {
        id: fileId,
      },
      include: {
        section: {
          include: {
            publication: {
              include: {
                collaborations: {
                  where: {
                    userId: userId,
                    status: 'ACCEPTED',
                    role: { in: ['AUTHOR', 'EDITOR'] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const isOwner = file.section.publication.authorId === userId;
    const isCollaborator = file.section.publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to delete this file',
      );
    }

    await this.cloudinaryService.deleteFile(file.publicId);
    await this.prisma.sectionFile.delete({
      where: {
        id: fileId,
      },
    });

    return 'File deleted successfully';
  }

  async deletePublication(userId: string, publicationId: string) {
    const publication = await this.prisma.publication.findUnique({
      where: {
        id: publicationId,
      },
      include: {
        author: true,
        collaborations: {
          where: {
            userId: userId,
            status: 'ACCEPTED',
            role: { in: ['AUTHOR', 'EDITOR'] },
          },
        },
        sections: {
          include: {
            files: true,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    const isOwner = publication.authorId === userId;
    const isCollaborator = publication.collaborations.length > 0;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isCollaborator && !isAdmin) {
      throw new UnauthorizedException(
        'You do not have permission to delete this publication',
      );
    }

    if (publication.sections && publication.sections.length > 0) {
      const allFiles = publication.sections
        .flatMap((section) => section.files)
        .filter((file) => file.publicId);

      await Promise.all(
        allFiles.map((file) =>
          this.cloudinaryService.deleteFile(file.publicId),
        ),
      );
    }

    await this.prisma.$transaction([
      this.prisma.like.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.comment.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.bookmark.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.collaboration.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.version.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.reward.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.aIFeature.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.event.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.sectionFile.deleteMany({
        where: {
          section: {
            publicationId: publicationId,
          },
        },
      }),

      this.prisma.section.deleteMany({
        where: {
          publicationId: publicationId,
        },
      }),

      this.prisma.publication.delete({
        where: {
          id: publicationId,
        },
      }),
    ]);

    return 'Publication and all related data deleted successfully';
  }

  async deleteSection(userId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        publication: {
          include: {
            collaborations: {
              where: {
                userId: userId,
                status: 'ACCEPTED',
                role: { in: ['AUTHOR', 'EDITOR'] },
              },
            },
          },
        },
        files: true,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const isOwner = section.publication.authorId === userId;
    const isCollaborator = section.publication.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new UnauthorizedException(
        'You do not have permission to delete this section',
      );
    }

    if (section.files && section.files.length > 0) {
      await Promise.all(
        section.files.map(async (file) => {
          await this.cloudinaryService.deleteFile(file.publicId);
        }),
      );
    }

    await this.prisma.section.delete({
      where: {
        id: sectionId,
      },
    });

    return 'Section deleted successfully';
  }

  mapPublicationToResponse(
    publication: any,
    options?: {
      userId?: string;
      includeDetails?: boolean;
      includeCollaborationStatus?: boolean;
    },
  ) {
    const {
      userId,
      includeDetails = false,
      includeCollaborationStatus = false,
    } = options || {};

    const collaborators =
      publication.collaborations?.map((collab) => {
        const collaborator = {
          id: collab.id,
          user: {
            id: collab.user.id,
            name: collab.user.name,
            role: collab.user.role,
            profileImageUrl: collab.user.profile?.profileImageUrl || null,
          },
        };

        if (includeCollaborationStatus) {
          return {
            ...collaborator,
            status: collab.status,
          };
        }

        return collaborator;
      }) || [];

    const isLiked = userId && publication.likes?.length > 0;

    const basePublication = {
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
      visibility: publication.visibility,
      status: publication.status,
      categoryName: publication.category.name,
      categoryId: publication.category.id,
      authorName: publication.author.name || 'Unknown',
      authorId: publication.author.id,
      authorAvatar: publication.author.profile?.profileImageUrl || null,
      collaborators,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };

    if (includeDetails) {
      const sections =
        publication.sections?.map((section) => ({
          id: section.id,
          title: section.title,
          orderIndex: section.orderIndex,
          type: section.type,
          content: section.content,
          files:
            section.files?.map((file) => ({
              id: file.id,
              url: file.url,
            })) || [],
        })) || [];

      return {
        ...basePublication,
        sections,
        ...(publication.author.email && {
          authorEmail: publication.author.email,
        }),
        ...(userId !== undefined && { isLiked }),
      };
    }

    return {
      ...basePublication,
      ...(userId !== undefined && { isLiked }),
    };
  }
}
