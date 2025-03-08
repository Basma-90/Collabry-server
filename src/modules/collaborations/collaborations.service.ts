import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCollaborationDto } from './dtos/create-collaboration.dto';
import { CollaborationStatus, CollaboratorRole } from '@prisma/client';
import { CollaborationQueryDto } from './dtos/collaboration-query.dto';
import { UpdateCollaborationDto } from './dtos/update-collaboration.dto';
import { RequestContributionDto } from './dtos/request-contribution.dto.ts.dto';
@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(private prisma: PrismaService) {}
  async createCollaboration(
    userId: string,
    createCollaborationDto: CreateCollaborationDto,
  ) {
    this.logger.debug(
      `Creating collaboration invitation: ${JSON.stringify(createCollaborationDto)}`,
    );

    const publication = await this.prisma.publication.findUnique({
      where: { id: createCollaborationDto.publicationId },
      include: {
        author: true,
        collaborations: true,
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const isAuthorOrAdmin =
      publication.authorId === userId ||
      publication.collaborations.some(
        (collab) =>
          collab.userId === userId &&
          (collab.role === CollaboratorRole.AUTHOR ||
            collab.role === CollaboratorRole.EDITOR) &&
          collab.status === CollaborationStatus.ACCEPTED,
      );

    if (!isAuthorOrAdmin) {
      throw new ForbiddenException(
        'You do not have permission to add collaborators to this publication',
      );
    }

    const existingCollaboration = await this.prisma.collaboration.findFirst({
      where: {
        userId: createCollaborationDto.userId,
        publicationId: createCollaborationDto.publicationId,
      },
    });

    if (existingCollaboration) {
      throw new BadRequestException(
        'Collaboration already exists for this user and publication',
      );
    }

    const collaboration = await this.prisma.collaboration.create({
      data: {
        role: createCollaborationDto.role,
        status: CollaborationStatus.PENDING,
        requestType: 'OWNER_INVITATION',
        message: createCollaborationDto.message,
        user: { connect: { id: createCollaborationDto.userId } },
        publication: { connect: { id: createCollaborationDto.publicationId } },
      },
      include: {
        user: true,
        publication: true,
      },
    });

    // Send notification to the invited user
    // await this.notificationService.createNotification({
    //   userId: createCollaborationDto.userId,
    //   type: 'COLLABORATION_INVITE',
    //   message: `You have been invited to collaborate on "${publication.title}" as a ${collaboration.role.toLowerCase()}`,
    // });

    return {
      message: 'Collaboration invitation sent successfully',
    };
  }

  async updateCollaborationStatus(
    userId: string,
    collaborationId: string,
    status: CollaborationStatus,
  ) {
    this.logger.debug(
      `Updating collaboration status: ${collaborationId} to ${status}`,
    );

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: { publication: true },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (collaboration.userId !== userId) {
      throw new ForbiddenException('You cannot update this collaboration');
    }

    // Update the collaboration status
    const updatedCollaboration = await this.prisma.collaboration.update({
      where: { id: collaborationId },
      data: { status },
      include: {
        user: true,
        publication: true,
      },
    });

    // Notify the publication author about the status change
    // await this.notificationService.createNotification({
    //   userId: updatedCollaboration.publication.authorId,
    //   type: 'COLLABORATION_UPDATE',
    //   message: `Collaboration invitation for "${updatedCollaboration.publication.title}" was ${status.toLowerCase()} by ${updatedCollaboration.user.name || updatedCollaboration.user.email}`,
    // });

    return {
      message: 'Collaboration status updated successfully',
    };
  }

  async updateCollaboration(
    userId: string,
    collaborationId: string,
    updateCollaborationDto: UpdateCollaborationDto,
  ) {
    this.logger.debug(
      `Updating collaboration: ${collaborationId} with ${JSON.stringify(updateCollaborationDto)}`,
    );

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: { publication: true },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (collaboration.publication.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this collaboration',
      );
    }

    await this.prisma.collaboration.update({
      where: { id: collaborationId },
      data: updateCollaborationDto,
      include: {
        user: true,
        publication: true,
      },
    });

    return {
      message: 'Collaboration updated successfully',
    };
  }

  async removeCollaboration(userId: string, collaborationId: string) {
    this.logger.debug(`Removing collaboration: ${collaborationId}`);

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: { publication: true },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (
      collaboration.userId !== userId &&
      collaboration.publication.authorId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove this collaboration',
      );
    }

    await this.prisma.collaboration.delete({
      where: { id: collaborationId },
      include: {
        user: true,
        publication: true,
      },
    });

    return {
      message: 'Collaboration removed successfully',
    };
  }

  async findAllWithFiltering(query: CollaborationQueryDto) {
    this.logger.debug(
      `Finding collaborations with filters: ${JSON.stringify(query)}`,
    );

    const skip =
      typeof query.skip === 'string'
        ? parseInt(query.skip, 10)
        : query.skip || 0;
    const take =
      typeof query.take === 'string'
        ? parseInt(query.take, 10)
        : query.take || 10;
    const { userId, publicationId, role, status } = query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (publicationId) {
      where.publicationId = publicationId;
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    return await this.prisma.collaboration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        publication: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async findSpecificCollaboration(id: string) {
    this.logger.debug(`Finding collaboration by id: ${id}`);

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        publication: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID ${id} not found`);
    }

    return collaboration;
  }

  async getPublicationCollaborators(publicationId: string) {
    this.logger.debug(
      `Getting collaborators for publication: ${publicationId}`,
    );

    const publicationExists = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      select: { id: true },
    });

    if (!publicationExists) {
      throw new NotFoundException(
        `Publication with ID ${publicationId} not found`,
      );
    }

    const collaborations = await this.prisma.collaboration.findMany({
      where: {
        publicationId,
        status: CollaborationStatus.ACCEPTED,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return collaborations.map((collab) => {
      return {
        id: collab.userId,
        name: collab.user.name,
        email: collab.user.email,
        profile: collab.user.profile,
      };
    });
  }

  async getUserCollaborations(userId: string) {
    this.logger.debug(`Getting collaborations for user: ${userId}`);

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const collaborations = await this.prisma.collaboration.findMany({
      where: {
        userId,
        status: CollaborationStatus.ACCEPTED,
      },
      include: {
        publication: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            category: true,
          },
        },
      },
    });

    return collaborations.map((collab) => {
      return {
        id: collab.publication.id,
        title: collab.publication.title,
        abstract: collab.publication.abstract,
        status: collab.publication.status,
        author: {
          id: collab.publication.author.id,
          name: collab.publication.author.name,
          email: collab.publication.author.email,
        },
        category: collab.publication.category,
      };
    });
  }

  async countCollaborators(publicationId: string) {
    this.logger.debug(
      `Counting collaborators for publication: ${publicationId}`,
    );

    const publicationExists = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      select: { id: true },
    });

    if (!publicationExists) {
      throw new NotFoundException(
        `Publication with ID ${publicationId} not found`,
      );
    }

    return this.prisma.collaboration.count({
      where: {
        publicationId,
        status: CollaborationStatus.ACCEPTED,
      },
    });
  }

  async getUserContributionRequests(userId: string) {
    this.logger.debug(`Getting contribution requests for user: ${userId}`);

    const contributionRequests = await this.prisma.collaboration.findMany({
      where: {
        userId,
        requestType: 'CONTRIBUTOR_REQUEST',
      },
      include: {
        publication: {
          select: {
            id: true,
            title: true,
            abstract: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: contributionRequests,
      meta: {
        count: contributionRequests.length,
      },
    };
  }

  async requestContribution(
    userId: string,
    publicationId: string,
    requestContributionDto: RequestContributionDto,
  ) {
    this.logger.debug(
      `Creating contribution request for publication: ${publicationId}`,
    );

    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        author: true,
        collaborations: {
          where: {
            userId,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    if (publication.collaborations.length > 0) {
      throw new BadRequestException(
        'You already have a collaboration or request for this publication',
      );
    }

    if (publication.authorId === userId) {
      throw new BadRequestException(
        'You cannot request to contribute to your own publication',
      );
    }

    const collaboration = await this.prisma.collaboration.create({
      data: {
        role: requestContributionDto.role,
        status: CollaborationStatus.PENDING,
        message: requestContributionDto.message,
        requestType: 'CONTRIBUTOR_REQUEST',
        user: { connect: { id: userId } },
        publication: { connect: { id: publicationId } },
      },
      include: {
        user: true,
        publication: true,
      },
    });

    // Send notification to the publication author
    // await this.notificationService.createNotification({
    //   userId: publication.authorId,
    //   type: 'CONTRIBUTION_REQUEST',
    //   message: `${collaboration.user.name || collaboration.user.email} has requested to contribute to "${publication.title}" as a ${collaboration.role.toLowerCase()}`,
    // });

    return {
      message: 'Contribution request sent successfully',
      data: collaboration,
    };
  }

  async respondToContributionRequest(
    userId: string,
    collaborationId: string,
    status: CollaborationStatus,
  ) {
    this.logger.debug(
      `Responding to contribution request: ${collaborationId} with status ${status}`,
    );

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: {
        publication: true,
        user: true,
      },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration request not found');
    }

    if (collaboration.publication.authorId !== userId) {
      throw new ForbiddenException(
        'Only the publication owner can respond to contribution requests',
      );
    }

    if (collaboration.requestType !== 'CONTRIBUTOR_REQUEST') {
      throw new BadRequestException('This is not a contribution request');
    }

    const updatedCollaboration = await this.prisma.collaboration.update({
      where: { id: collaborationId },
      data: { status },
      include: {
        user: true,
        publication: true,
      },
    });

    // Notify the requester about the status change
    // await this.notificationService.createNotification({
    //   userId: updatedCollaboration.userId,
    //   type: 'CONTRIBUTION_RESPONSE',
    //   message: `Your request to contribute to "${updatedCollaboration.publication.title}" has been ${status.toLowerCase()}`,
    // });

    return {
      message: `Contribution request ${status.toLowerCase()} successfully`,
      data: updatedCollaboration,
    };
  }

  async getPublicationContributionRequests(
    userId: string,
    publicationId: string,
  ) {
    this.logger.debug(
      `Getting contribution requests for publication: ${publicationId}`,
    );

    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      select: { id: true, authorId: true },
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with ID ${publicationId} not found`,
      );
    }

    if (publication.authorId !== userId) {
      throw new ForbiddenException(
        'Only the publication owner can view contribution requests',
      );
    }

    const contributionRequests = await this.prisma.collaboration.findMany({
      where: {
        publicationId,
        requestType: 'CONTRIBUTOR_REQUEST',
        status: CollaborationStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        publication: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: contributionRequests,
      meta: {
        count: contributionRequests.length,
        publicationId,
      },
    };
  }

  async verifyPublicationExists(publicationId: string): Promise<boolean> {
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      select: { id: true },
    });

    return !!publication;
  }
}
