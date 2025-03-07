import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dtos/createComment.dto';
import { CommentQueryDto } from './dtos/CommentQuery.dto';
import { UpdateCommentDto } from './dtos/updateComment.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNewComment(userId: string, createCommentDto: CreateCommentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Only authenticated users can create comments',
      );
    }

    const publication = await this.prisma.publication.findUnique({
      where: { id: createCommentDto.publicationId },
    });

    if (!publication) {
      throw new NotFoundException(
        `Publication with ID ${createCommentDto.publicationId} not found`,
      );
    }

    // If this is a reply, check if parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with ID ${createCommentDto.parentId} not found`,
        );
      }

      // Ensure parent comment is on the same publication
      if (parentComment.publicationId !== createCommentDto.publicationId) {
        throw new ForbiddenException(
          'Parent comment must belong to the same publication',
        );
      }
    }

    // Create the comment
    await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        author: {
          connect: { id: userId },
        },
        publication: {
          connect: { id: createCommentDto.publicationId },
        },
        ...(createCommentDto.parentId && {
          parent: {
            connect: { id: createCommentDto.parentId },
          },
        }),
      },
    });
    return 'Comment created successfully';
  }

  async findAllWithFiltering(query: CommentQueryDto) {
    const { publicationId, parentId, authorId, skip, take } = query;

    this.logger.debug(
      `Finding comments with: publicationId=${publicationId}, parentId=${parentId}, authorId=${authorId}`,
    );

    const where: any = {};

    if (publicationId) {
      where.publicationId = publicationId;
    }

    if (parentId === undefined) {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    this.logger.debug(`Final where clause: ${JSON.stringify(where)}`);

    try {
      const comments = await this.prisma.comment.findMany({
        include: {
          replies: {
            select: { id: true },
          },
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        skip: typeof skip === 'string' ? parseInt(skip, 10) : skip || 0,
        take: typeof take === 'string' ? parseInt(take, 10) : take || 10,
        orderBy: { createdAt: 'desc' },
      });

      this.logger.debug(`Found ${comments.length} comments`);
      return comments;
    } catch (error) {
      this.logger.error(`Error finding comments: ${error.message}`);
      throw error;
    }
  }

  async verifyPublicationExists(publicationId: string): Promise<boolean> {
    try {
      const publication = await this.prisma.publication.findUnique({
        where: { id: publicationId },
        select: { id: true },
      });

      return !!publication;
    } catch (error) {
      this.logger.error(
        `Error verifying publication ${publicationId}: ${error.message}`,
      );
      return false;
    }
  }

  async findSpecificComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: {
          select: { id: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    return comment;
  }

  async updateComment(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException(
        'Only authenticated users can update comments',
      );
    }
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this comment');
    }
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: updateCommentDto.content },
    });
    return 'Comment updated successfully';
  }

  async removeComment(userId: string, commentId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException(
        'Only authenticated users can remove comments',
      );
    }
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this comment');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return 'Comment deleted successfully';
  }

  async getReplies(commentId: string, skip = 0, take = 10) {
    return await this.prisma.comment.findMany({
      where: {
        parentId: commentId,
      },
      include: {
        replies: {
          select: { id: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countComments(publicationId: string) {
    return await this.prisma.comment.count({
      where: { publicationId },
    });
  }
}
