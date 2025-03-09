import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { authGuard } from '../../guards/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { NotificationQueryDto } from './dtos/notification-query.dto';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';
import { NotificationType } from '@prisma/client';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**-----------------------------------------------
 * @desc    Get all notifications with filtering options
 * @route   GET /notifications/all
 * @access  Authenticated users
 ------------------------------------------------*/
  @Get('all')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications with filtering options' })
  @ApiQuery({ name: 'type', enum: NotificationType, required: false })
  @ApiQuery({ name: 'read', type: Boolean, required: false })
  @ApiQuery({ name: 'important', type: Boolean, required: false })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of notifications',
    type: [NotificationResponseDto],
  })
  async findAllWithFiltering(@Req() req, @Query() query: NotificationQueryDto) {
    this.logger.debug(`Received query params: ${JSON.stringify(query)}`);

    const userId = req.user.id;

    const result = await this.notificationsService.findAllWithFiltering({
      ...query,
      userId,
      lean: true, // Add lean query option for better performance
    });

    return {
      data: result.notifications,
      meta: {
        count: result.notifications.length,
        total: result.total,
        unreadCount: result.unreadCount,
        userId,
        type: query.type,
        read: query.read,
        skip: query.skip || 0,
        take: query.take || 10,
      },
    };
  }

  /**-----------------------------------------------
   * @desc    Get unread notifications count
   * @route   GET /notifications/unread-count
   * @access  Authenticated users
   ------------------------------------------------*/
  @Get('unread-count')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread notification count and stats',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
        total: { type: 'number', example: 25 },
        countByType: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: {
            SYSTEM: 2,
            COMMENT: 1,
            MESSAGE: 2,
          },
        },
      },
    },
  })
  async getUnreadCount(@Req() req) {
    return await this.notificationsService.getNotificationCounts(req.user.id);
  }

  /**-----------------------------------------------
   * @desc    Get a specific notification by ID
   * @route   GET /notifications/:id
   * @access  Authenticated users (own notifications or admin)
   ------------------------------------------------*/
  @Get(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The notification details',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not own this notification',
  })
  async findOne(@Param('id', MongoIdValidationPipe) id: string, @Req() req) {
    const notification = await this.notificationsService.findOne(id);

    // Verify ownership unless admin
    if (notification.userId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    return notification;
  }

  /**-----------------------------------------------
   * @desc    Mark a notification as read
   * @route   PATCH /notifications/:id/read
   * @access  Authenticated users (own notifications)
   ------------------------------------------------*/
  @Patch(':id/read')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not own this notification',
  })
  async markAsRead(@Param('id', MongoIdValidationPipe) id: string, @Req() req) {
    return this.notificationsService.readNotifcation(req.user.id, id);
  }

  /**-----------------------------------------------
   * @desc    Mark all notifications as read
   * @route   PATCH /notifications/mark-all-read
   * @access  Authenticated users
   ------------------------------------------------*/
  @Patch('mark-all-read')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Req() req) {
    return await this.notificationsService.markAllAsRead(req.user.id);
  }

  /**-----------------------------------------------
   * @desc    Delete a notification
   * @route   DELETE /notifications/notification/:id
   * @access  Authenticated users (own notifications)
   ------------------------------------------------*/
  @Delete('notification/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not own this notification',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', MongoIdValidationPipe) id: string, @Req() req) {
    return await this.notificationsService.removeNotification(req.user.id, id);
  }

  /**-----------------------------------------------
   * @desc    Delete all read notifications
   * @route   DELETE /notifications/clear-read
   * @access  Authenticated users
   ------------------------------------------------*/
  @Delete('clear-read')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all read notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Read notifications deleted',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 8 },
        message: { type: 'string', example: 'Deleted 8 read notifications' },
      },
    },
  })
  async clearReadNotifications(@Req() req) {
    const count = await this.notificationsService.clearReadNotifications(
      req.user.id,
    );
    return {
      count,
      message: `Deleted ${count} read notifications`,
    };
  }
}
