import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PublicationsService } from './publications.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreatePublicationDto,
  PublicationStatusDto,
  PublicationVisibilityDto,
  SectionDto,
  UpdateSectionDto,
} from './dtos/publication.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { authGuard } from '../../guards/auth.guard';
import {
  PublicationDetailResponseDto,
  PublicationListResponseDto,
} from './dtos/publicationResponse.dto';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}
  /**-----------------------------------------------
 * @desc    create a new publication
 * @route   /publications/create 
 * @method  Post
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Post('create')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new publication' })
  @ApiResponse({
    status: 201,
    description: 'Publication created successfully',
    type: PublicationDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreatePublicationDto })
  async createPublication(
    @Req() req,
    @Body() createPublicationDto: CreatePublicationDto,
  ) {
    return await this.publicationsService.createPublication(
      req.user.id,
      createPublicationDto,
    );
  }

  /**-----------------------------------------------
* @desc    get a single publication
* @route   /publications/publication/:id 
* @method  Get
* @access  for authenticated user 
------------------------------------------------*/
  @Get('publication/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single publication- may be draft' })
  @ApiResponse({
    status: 200,
    description: 'Publication retrieved successfully',
    type: PublicationDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSinglePublication(@Req() req, @Param('id') publicationId: string) {
    return await this.publicationsService.getSinglePublication(
      req.user.id,
      publicationId,
    );
  }

  /**-----------------------------------------------
* @desc    get a publications of user
* @route   /publications/user 
* @method  Get
* @access  for authenticated user 
------------------------------------------------*/
  @Get('user')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get publications of user' })
  @ApiResponse({
    status: 200,
    description: 'Publications retrieved successfully',
    type: [PublicationListResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllPublicationsForUser(@Req() req) {
    return await this.publicationsService.getAllPublicationsForUser(
      req.user.id,
    );
  }

  /**-----------------------------------------------
* @desc    change a publication
* @route   /publications/publication/:id 
* @method  Put
* @access  for authenticated user 
------------------------------------------------*/
  @Put('publication/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change a publication' })
  @ApiResponse({
    status: 200,
    description: 'Publication updated successfully',
    type: PublicationDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreatePublicationDto })
  async changePublication(
    @Req() req,
    @Param('id') publicationId: string,
    @Body() createPublicationDto: CreatePublicationDto,
  ) {
    return await this.publicationsService.changePublication(
      req.user.id,
      publicationId,
      createPublicationDto,
    );
  }

  /**-----------------------------------------------
* @desc    change status of publication
* @route   /publications/author/status/:id
* @method  Patch
* @access  for authenticated user 
------------------------------------------------*/
  @Patch('author/status/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change status of publication' })
  @ApiResponse({
    status: 200,
    description: 'Publication status changed successfully',
    type: PublicationDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: PublicationStatusDto })
  async changePublicationStatus(
    @Req() req,
    @Param('id') publicationId: string,
    @Body() status: PublicationStatusDto,
  ) {
    return await this.publicationsService.changePublicationStatus(
      req.user.id,
      publicationId,
      status,
    );
  }

  /**-----------------------------------------------
* @desc    change visibility of publication
* @route   /publications/author/visibility/:id
* @method  Patch
* @access  for authenticated user 
------------------------------------------------*/
  @Patch('author/visibility/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change visibility of publication' })
  @ApiResponse({
    status: 200,
    description: 'Publication visibility changed successfully',
    type: PublicationDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: PublicationVisibilityDto })
  async changePublicationVisibility(
    @Req() req,
    @Param('id') publicationId: string,
    @Body() visibility: PublicationVisibilityDto,
  ) {
    return await this.publicationsService.changePublicationVisibility(
      req.user.id,
      publicationId,
      visibility,
    );
  }

  /**-----------------------------------------------
* @desc    get all publications 
* @route   /publications/all
* @method  Get
* @access  public 
------------------------------------------------*/
  @Get('all')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all publications' })
  @ApiResponse({
    status: 200,
    description: 'All publications retrieved successfully',
    type: [PublicationListResponseDto],
  })
  async getAllPublications(@Req() req) {
    const userId = req.user?.id;

    return await this.publicationsService.getPublicPublications(userId);
  }

  /**-----------------------------------------------
* @desc    get single publication 
* @route   /publications/:id
* @method  Get
* @access  public 
------------------------------------------------*/
  @Get(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single publication' })
  @ApiResponse({
    status: 200,
    description: 'Publication retrieved successfully',
    type: PublicationDetailResponseDto,
  })
  async getPublication(@Req() req, @Param('id') publicationId: string) {
    const userId = req.user?.id;
    return await this.publicationsService.getPublicPublication(
      publicationId,
      userId,
    );
  }

  //--------------------------------------

  /**-----------------------------------------------
* @desc    create a new section for the publication
* @route   /publications/section/create 
* @method  Post
* @access  for authenticated user 
------------------------------------------------*/
  @Post('section/create')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new section for the publication' })
  @ApiResponse({
    status: 201,
    description: 'Section created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SectionDto })
  @UseInterceptors(FilesInterceptor('files'))
  async createSection(
    @Req() req,
    @Body() sectionDto: SectionDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return await this.publicationsService.createSection(
      req.user.id,
      sectionDto,
      files,
    );
  }

  /**-----------------------------------------------
* @desc    get a single section for the publication
* @route   /publications/section/:id 
* @method  Get
* @access  for authenticated user 
------------------------------------------------*/
  @Get('section/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single section for the publication' })
  @ApiResponse({
    status: 200,
    description: 'Section retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSingleSection(@Req() req, @Param('id') sectionId: string) {
    return await this.publicationsService.getSingleSection(
      req.user.id,
      sectionId,
    );
  }

  /**-----------------------------------------------
* @desc    update a single section for the publication
* @route   /publications/section/:id 
* @method  Put
* @access  for authenticated user 
------------------------------------------------*/
  @Put('section/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a single section for the publication' })
  @ApiResponse({
    status: 200,
    description: 'Section updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: UpdateSectionDto })
  async updateSection(
    @Req() req,
    @Param('id') sectionId: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return await this.publicationsService.updateSection(
      req.user.id,
      sectionId,
      updateSectionDto,
    );
  }

  /**-----------------------------------------------
* @desc    add a new file for section
* @route   /publications/section/add-file/:id 
* @method  Post
* @access  for authenticated user 
------------------------------------------------*/
  @Post('section/add-file/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new file for section' })
  @ApiResponse({
    status: 201,
    description: 'File added successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  async addSectionFile(
    @Req() req,
    @Param('id') sectionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.publicationsService.addSectionFile(
      req.user.id,
      sectionId,
      file,
    );
  }

  /**-----------------------------------------------
* @desc    delete a file for section
* @route   /publications/section/file/:id 
* @method  delete
* @access  for authenticated user 
------------------------------------------------*/
  @Delete('section/file/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file for section' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteSectionFile(@Req() req, @Param('id') fileId: string) {
    return await this.publicationsService.deleteSectionFile(
      req.user.id,
      fileId,
    );
  }

  /**-----------------------------------------------
* @desc    delete a publication
* @route   /publications/publication/:id 
* @method  delete
* @access  for authenticated user - admin
------------------------------------------------*/
  @Delete('publication/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a publication' })
  @ApiResponse({ status: 200, description: 'Publication deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async deletePublication(@Req() req, @Param('id') publicationId: string) {
    return await this.publicationsService.deletePublication(
      req.user.id,
      publicationId,
    );
  }

  /**-----------------------------------------------
   * @desc    delete a section
   * @route   /publications/section/:id
   * @method  delete
   * @access  for authenticated user
   * ------------------------------------------------*/
  @Delete('section/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async deleteSection(@Req() req, @Param('id') sectionId: string) {
    return await this.publicationsService.deleteSection(req.user.id, sectionId);
  }
}
