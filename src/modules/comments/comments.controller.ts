import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { authGuard } from '../../guards/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCommentDto } from './dtos/createComment.dto';
import { CommentResponseDto } from './dtos/CommentResponse.dto';
import { CommentQueryDto } from './dtos/CommentQuery.dto';
import { UpdateCommentDto } from './dtos/updateComment.dto';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@Controller('comments')
export class CommentsController {
  private readonly logger = new Logger(CommentsController.name);
  constructor(private readonly commentsService: CommentsService) {}

  /**-----------------------------------------------
 * @desc    create a new comment
 * @route   /comments/create 
 * @method  Post
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Post('create')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The comment has been successfully created.',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication or parent comment not found.',
  })
  async createNewComment(
    @Req() req,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.createNewComment(req.user.id, createCommentDto);
  }

  /**-----------------------------------------------
 * @desc    Get all comments with filtering options
 * @route   /comments/all 
 * @method  Get
 * @access  public 
 ------------------------------------------------*/
  @Get('all')
  @ApiOperation({ summary: 'Get all comments with filtering options' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of comments',
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication not found or no comments exist',
  })
  async findAllWithFiltering(@Query() query: CommentQueryDto) {
    this.logger.debug(`Received query params: ${JSON.stringify(query)}`);

    if (query.publicationId) {
      const exists = await this.commentsService.verifyPublicationExists(
        query.publicationId,
      );
      if (!exists) {
        throw new NotFoundException(
          `Publication with ID ${query.publicationId} not found`,
        );
      }
    }

    const comments = await this.commentsService.findAllWithFiltering(query);

    return {
      data: comments,
      meta: {
        count: comments.length,
        publicationId: query.publicationId,
        parentId: query.parentId,
        authorId: query.authorId,
        skip: query.skip || 0,
        take: query.take || 10,
      },
    };
  }

  /**-----------------------------------------------
 * @desc    Get a specific comment by ID
 * @route   /comments/:id
 * @method  Get
 * @access  public 
 ------------------------------------------------*/
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The comment details',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found',
  })
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    return this.commentsService.findSpecificComment(id);
  }

  /**-----------------------------------------------
 * @desc    update a comment
 * @route   /comments/:id
 * @method  Patch
 * @access  for authendicated user
 ------------------------------------------------*/
  @Patch(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The comment has been successfully updated.',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the author of the comment.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found.',
  })
  async updateComment(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(
      req.user.id,
      id,
      updateCommentDto,
    );
  }

  /**-----------------------------------------------
 * @desc    delete a comment
 * @route   /comments/:id
 * @method  Delete
 * @access  for authendicated user 
 ------------------------------------------------*/
  @Delete(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The comment has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the author of the comment.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found.',
  })
  async remove(@Param('id', MongoIdValidationPipe) id: string, @Req() req) {
    return await this.commentsService.removeComment(req.user.id, id);
  }

  /**-----------------------------------------------
 * @desc    Get replies to a specific comment
 * @route   /comments/replies/:id
 * @method  Get
 * @access  public 
 ------------------------------------------------*/
  @Get('replies/:id')
  @ApiOperation({ summary: 'Get replies to a specific comment' })
  @ApiParam({ name: 'id', description: 'Parent comment ID' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to take',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of reply comments',
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent comment not found',
  })
  async getReplies(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.commentsService.getReplies(id, skip, take);
  }

  /**-----------------------------------------------
 * @desc    get a count comments fo a publication
 * @route   /comments/publication/:publicationId/count
 * @method  get
 * @access  public 
 ------------------------------------------------*/
  @Get('publication/:publicationId/count')
  @ApiOperation({ summary: 'Count comments for a publication' })
  @ApiParam({ name: 'publicationId', description: 'Publication ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comment count',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 42 },
      },
    },
  })
  async countComments(
    @Param('publicationId', MongoIdValidationPipe) publicationId: string,
  ) {
    const count = await this.commentsService.countComments(publicationId);
    return { count };
  }
}
