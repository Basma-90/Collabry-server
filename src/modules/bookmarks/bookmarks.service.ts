import { PrismaService } from 'src/prisma/prisma.service';

export class BookmarkService {
  constructor(private prisma: PrismaService) {}
  async getUserBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId: userId },
      include: {
        publication: {
          select: {
            id: true,
            title: true,
            abstract: true,
            language: true,
            keywords: true,
            author: {
              select: {
                // name: true,
                email: true,
                profile: {
                  select: {
                    bio: true,
                    profileImageUrl: true,
                    profileImagePublicId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return { message: 'Bookmarks fetched successfully', data: bookmarks };
  }

  async deleteBookmark(bookmarkId: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId },
    });
    if (!bookmark) {
      return null;
    }
    await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
    return { message: 'Bookmark deleted successfully' };
  }

  async deleteAllBookmarks(userId: string) {
    await this.prisma.bookmark.deleteMany({
      where: {
        userId: userId,
      },
    });
    return { message: 'All bookmarks deleted successfully' };
  }

  async createBookmark(userId: string, publicationId: string) {
    const existingBookmark = await this.prisma.bookmark.findFirst({
      where: { userId: userId, publicationId: publicationId },
    });
    if (existingBookmark) {
      return { message: 'Bookmark already exists', data: existingBookmark };
    }
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId: userId,
        publicationId: publicationId,
      },
    });
    return { message: 'Bookmark created successfully', data: bookmark };
  }
}
