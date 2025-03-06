import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}
  async toggleLike(userId: string, publicationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { likes: true },
    });
    if (!user) {
      throw new UnauthorizedException('Please login to like a publication');
    }
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });
    if (!publication) {
      throw new UnauthorizedException('Publication not found');
    }
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_publicationId: {
          userId,
          publicationId,
        },
      },
    });
    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: {
        userId,
        publicationId,
      },
    });

    return { liked: true };
  }

  async getUserLikes(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { likes: true },
    });
    if (!user) {
      throw new UnauthorizedException('Please login to view your likes');
    }
    return user.likes;
  }

  async removeLike(userId: string, publicationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Please login to remove a like');
    }
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });
    if (!publication) {
      throw new UnauthorizedException('Publication not found');
    }
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_publicationId: {
          userId,
          publicationId,
        },
      },
    });
    if (!existingLike) {
      throw new UnauthorizedException('Like not found');
    }
    await this.prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
    return { message: 'Like removed successfully' };
  }
}
