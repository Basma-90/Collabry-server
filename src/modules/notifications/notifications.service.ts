import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { NotificationQueryDto } from './dtos/notification-query.dto';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(createNotificationDto: CreateNotificationDto) {
    this.logger.log(
      `Creating notification for user: ${createNotificationDto.userId}`,
    );

    return this.prisma.notification.create({
      data: {
        type: createNotificationDto.type,
        message: createNotificationDto.message,
        userId: createNotificationDto.userId,
        read: createNotificationDto.read ?? false,
        important: createNotificationDto.important ?? false,
        referenceId: createNotificationDto.referenceId,
        referenceType: createNotificationDto.referenceType,
        metadata: createNotificationDto.metadata,
        expiresAt: createNotificationDto.expiresAt
          ? new Date(createNotificationDto.expiresAt)
          : null,
      },
    });
  }

  async findAllWithFiltering(
    query: NotificationQueryDto & { userId: string; lean?: boolean },
  ) {
    const {
      userId,
      type,
      read,
      important,
      skip = 0,
      take = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lean = false,
    } = query;

    const where: any = { userId };

    if (type !== undefined) {
      where.type = type;
    }

    // Parse boolean values more strictly
    if (read !== undefined) {
      // Use Boolean constructor to ensure proper conversion
      // But first convert string representations explicitly
      const readBool =
        (typeof read === 'string' && read === 'true') ||
        (typeof read === 'boolean' && read === true)
          ? true
          : (typeof read === 'string' && read === 'false') ||
              (typeof read === 'boolean' && read === false)
            ? false
            : undefined;

      if (readBool !== undefined) {
        where.read = readBool;
      }
    }

    if (important !== undefined) {
      // Same approach for important flag
      const importantBool =
        (typeof important === 'string' && important === 'true') ||
        (typeof important === 'boolean' && important === true)
          ? true
          : (typeof important === 'string' && important === 'false') ||
              (typeof important === 'boolean' && important === false)
            ? false
            : undefined;

      if (importantBool !== undefined) {
        where.important = importantBool;
      }
    }

    // Handle expiration filtering
    where.AND = [
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    ];

    // Debug the where clause
    console.log('Where clause:', JSON.stringify(where));

    // Get total count and unread count for meta info
    try {
      const [total, unreadCount, notifications] = await Promise.all([
        this.prisma.notification.count({ where }),
        this.prisma.notification.count({
          where: {
            ...where,
            read: false, // This should be a proper boolean false, not a string
          },
        }),
        this.prisma.notification.findMany({
          where,
          skip: Number(skip),
          take: Number(take),
          orderBy: { [sortBy]: sortOrder },
        }),
      ]);

      return {
        notifications,
        total,
        unreadCount,
      };
    } catch (error) {
      console.error('Prisma error:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.debug(`Finding notification with ID: ${id}`);

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async readNotifcation(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this notification',
      );
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    return 'All notifications marked as read';
  }

  async getNotificationCounts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [total, unread] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    const notificationTypes = Object.values(NotificationType);
    const countByTypePromises = notificationTypes.map(async (type) => {
      const count = await this.prisma.notification.count({
        where: { userId, type, read: false },
      });
      return { type, count };
    });

    const typeCounts = await Promise.all(countByTypePromises);
    const countByType = typeCounts.reduce((acc, { type, count }) => {
      acc[type] = count;
      return acc;
    }, {});

    return {
      count: unread,
      total,
      countByType,
    };
  }

  async removeNotification(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this notification',
      );
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }

  async clearReadNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const result = await this.prisma.notification.deleteMany({
      where: { userId, read: true },
    });

    return result.count;
  }
}
