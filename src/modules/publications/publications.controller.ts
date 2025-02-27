import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
import { Request } from 'express';
import {
  CreatePublicationDto,
  PublicationStatusDto,
  PublicationVisibilityDto,
  SectionDto,
} from './dtos/publication.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { authGuard } from 'src/guards/auth.guard';

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
  @ApiResponse({ status: 201, description: 'Publication created successfully' })
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
 * @desc    create a new section for the publication
 * @route   /publications/section/create 
 * @method  Post
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Post('section/create')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new section for the publication' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
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
 * @desc    get a single publication (for author) ->section+category
 * @route   /publications/author/:id
 * @method  GET
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Get('author/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single publication (for author)' })
  @ApiResponse({
    status: 200,
    description: 'Publication retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPublication(@Req() req, @Param('id') publicationId: string) {
    return await this.publicationsService.getPublication(
      req.user.id,
      publicationId,
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
}
