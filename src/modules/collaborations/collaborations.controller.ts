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
import { CollaborationService } from './collaborations.service';
import { authGuard } from '../../guards/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCollaborationDto } from './dtos/create-collaboration.dto';
import { CollaborationResponseDto } from './dtos/collaboration-response.dto';
import { CollaborationQueryDto } from './dtos/collaboration-query.dto';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';
import { UpdateCollaborationDto } from './dtos/update-collaboration.dto';
import { CollaborationStatus } from '@prisma/client';
import { RequestContributionDto } from './dtos/request-contribution.dto.ts.dto';

@Controller('collaborations')
export class CollaborationsController {
  private readonly logger = new Logger(CollaborationsController.name);

  constructor(private readonly collaborationService: CollaborationService) {}

  /**-----------------------------------------------
   * @desc    Create a new collaboration invitation
   * @route   /collaborations/create 
   * @method  Post
   * @access  for authenticated user
   ------------------------------------------------*/
  @Post('create')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collaboration invitation' })
  @ApiBody({ type: CreateCollaborationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The collaboration invitation has been successfully created.',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or collaboration already exists.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to add collaborators to this publication.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication or user not found.',
  })
  async createCollaboration(
    @Req() req,
    @Body() createCollaborationDto: CreateCollaborationDto,
  ) {
    return this.collaborationService.createCollaboration(
      req.user.id,
      createCollaborationDto,
    );
  }

  /**-----------------------------------------------
     * @desc    Get all collaborations with filtering options
     * @route   /collaborations/all
     * @method  Get
     * @access  public
     ------------------------------------------------*/
  @Get('all')
  @ApiOperation({ summary: 'Get all collaborations with filtering options' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of collaborations',
    type: [CollaborationResponseDto],
  })
  async findAllWithFiltering(@Query() query: CollaborationQueryDto) {
    this.logger.debug(`Received query params: ${JSON.stringify(query)}`);

    if (query.publicationId) {
      const exists = await this.collaborationService.verifyPublicationExists(
        query.publicationId,
      );
      if (!exists) {
        throw new NotFoundException(
          `Publication with ID ${query.publicationId} not found`,
        );
      }
    }

    const collaborations =
      await this.collaborationService.findAllWithFiltering(query);

    return {
      data: collaborations,
      meta: {
        count: collaborations.length,
        publicationId: query.publicationId,
        userId: query.userId,
        role: query.role,
        status: query.status,
        skip: query.skip || 0,
        take: query.take || 10,
      },
    };
  }

  /**-----------------------------------------------
     * @desc    Get a specific collaboration by ID
     * @route   /collaborations/:id
     * @method  Get
     * @access  public
     ------------------------------------------------*/
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific collaboration by ID' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaboration details',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration not found',
  })
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    return this.collaborationService.findSpecificCollaboration(id);
  }

  /**-----------------------------------------------
     * @desc    Update a collaboration
     * @route   /collaborations/:id
     * @method  Patch
     * @access  for authenticated publication owner
     ------------------------------------------------*/
  @Patch(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a collaboration' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiBody({ type: UpdateCollaborationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaboration has been successfully updated.',
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
    description: 'User does not have permission to update this collaboration.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration not found.',
  })
  async updateCollaboration(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
    @Body() updateCollaborationDto: UpdateCollaborationDto,
  ) {
    return this.collaborationService.updateCollaboration(
      req.user.id,
      id,
      updateCollaborationDto,
    );
  }

  /**-----------------------------------------------
   * @desc    Accept a collaboration invitation
   * @route   /collaborations/:id/accept
   * @method  Patch
   * @access  for authenticated invited user
   ------------------------------------------------*/
  @Patch(':id/accept')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a collaboration invitation' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaboration invitation has been accepted.',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the invited collaborator.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration not found.',
  })
  async acceptCollaboration(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
  ) {
    return this.collaborationService.updateCollaborationStatus(
      req.user.id,
      id,
      CollaborationStatus.ACCEPTED,
    );
  }

  /**-----------------------------------------------
     * @desc    Reject a collaboration invitation
     * @route   /collaborations/:id/reject
     * @method  Patch
     * @access  for authenticated invited user
     ------------------------------------------------*/
  @Patch(':id/reject')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a collaboration invitation' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaboration invitation has been rejected.',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the invited collaborator.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration not found.',
  })
  async rejectCollaboration(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
  ) {
    return this.collaborationService.updateCollaborationStatus(
      req.user.id,
      id,
      CollaborationStatus.REJECTED,
    );
  }

  /**-----------------------------------------------
     * @desc    Delete a collaboration
     * @route   /collaborations/:id
     * @method  Delete
     * @access  for authenticated user with permission
     ------------------------------------------------*/
  @Delete(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a collaboration' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The collaboration has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to delete this collaboration.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration not found.',
  })
  async removeCollaboration(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
  ) {
    return this.collaborationService.removeCollaboration(req.user.id, id);
  }

  /**-----------------------------------------------
     * @desc    Get all collaborators for a publication
     * @route   /collaborations/publication/:publicationId/collaborators
     * @method  Get
     * @access  public
     ------------------------------------------------*/
  @Get('publication/:publicationId/collaborators')
  @ApiOperation({ summary: 'Get all collaborators for a publication' })
  @ApiParam({ name: 'publicationId', description: 'Publication ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of collaborators',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication not found',
  })
  async getPublicationCollaborators(
    @Param('publicationId', MongoIdValidationPipe) publicationId: string,
  ) {
    return this.collaborationService.getPublicationCollaborators(publicationId);
  }

  /**-----------------------------------------------
     * @desc    Get all publications a user is collaborating on
     * @route   /collaborations/user/:userId/publications
     * @method  Get
     * @access  public
     ------------------------------------------------*/
  @Get('user/:userId/publications')
  @ApiOperation({ summary: 'Get all publications a user is collaborating on' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of publications',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserCollaborations(
    @Param('userId', MongoIdValidationPipe) userId: string,
  ) {
    return this.collaborationService.getUserCollaborations(userId);
  }

  /**-----------------------------------------------
     * @desc    Count collaborators for a publication
     * @route   /collaborations/publication/:publicationId/count
     * @method  Get
     * @access  public
     ------------------------------------------------*/
  @Get('publication/:publicationId/count')
  @ApiOperation({ summary: 'Count collaborators for a publication' })
  @ApiParam({ name: 'publicationId', description: 'Publication ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Collaborator count',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication not found',
  })
  async countCollaborators(
    @Param('publicationId', MongoIdValidationPipe) publicationId: string,
  ) {
    const count =
      await this.collaborationService.countCollaborators(publicationId);
    return { count };
  }

  /**-----------------------------------------------
 * @desc    Get all contribution requests made by a user
 * @route   /collaborations/requests/my-requests
 * @method  Get
 * @access  for authenticated user
 ------------------------------------------------*/
  @Get('requests/my-requests')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all contribution requests made by the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of contribution requests',
    type: [CollaborationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  async getMyContributionRequests(@Req() req) {
    return this.collaborationService.getUserContributionRequests(req.user.id);
  }

  /**-----------------------------------------------
 * @desc    Request to contribute to a publication
 * @route   /collaborations/request/:publicationId
 * @method  Post
 * @access  for authenticated user
 ------------------------------------------------*/
  @Post('request/:publicationId')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request to contribute to a publication' })
  @ApiParam({ name: 'publicationId', description: 'Publication ID' })
  @ApiBody({ type: RequestContributionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The contribution request has been successfully created.',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or request already exists.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication not found.',
  })
  async requestContribution(
    @Param('publicationId', MongoIdValidationPipe) publicationId: string,
    @Req() req,
    @Body() requestContributionDto: RequestContributionDto,
  ) {
    return this.collaborationService.requestContribution(
      req.user.id,
      publicationId,
      requestContributionDto,
    );
  }

  /**-----------------------------------------------
 * @desc    Accept a contribution request
 * @route   /collaborations/requests/:id/accept
 * @method  Patch
 * @access  for authenticated publication owner
 ------------------------------------------------*/
  @Patch('requests/:id/accept')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a contribution request' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The contribution request has been accepted.',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the publication owner.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration request not found.',
  })
  async acceptContributionRequest(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
  ) {
    return this.collaborationService.respondToContributionRequest(
      req.user.id,
      id,
      CollaborationStatus.ACCEPTED,
    );
  }

  /**-----------------------------------------------
 * @desc    Reject a contribution request
 * @route   /collaborations/requests/:id/reject
 * @method  Patch
 * @access  for authenticated publication owner
 ------------------------------------------------*/
  @Patch('requests/:id/reject')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a contribution request' })
  @ApiParam({ name: 'id', description: 'Collaboration ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The contribution request has been rejected.',
    type: CollaborationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the publication owner.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaboration request not found.',
  })
  async rejectContributionRequest(
    @Param('id', MongoIdValidationPipe) id: string,
    @Req() req,
  ) {
    return this.collaborationService.respondToContributionRequest(
      req.user.id,
      id,
      CollaborationStatus.REJECTED,
    );
  }

  /**-----------------------------------------------
 * @desc    Get all contribution requests for a publication
 * @route   /collaborations/publication/:publicationId/requests
 * @method  Get
 * @access  for authenticated publication owner
 ------------------------------------------------*/
  @Get('publication/:publicationId/requests')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all contribution requests for a publication' })
  @ApiParam({ name: 'publicationId', description: 'Publication ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of contribution requests',
    type: [CollaborationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not the publication owner.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Publication not found.',
  })
  async getPublicationContributionRequests(
    @Param('publicationId', MongoIdValidationPipe) publicationId: string,
    @Req() req,
  ) {
    return this.collaborationService.getPublicationContributionRequests(
      req.user.id,
      publicationId,
    );
  }
}
