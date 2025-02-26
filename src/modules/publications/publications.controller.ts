import {
  Body,
  Controller,
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
import { CreatePublicationDto, SectionDto } from './dtos/publication.dto';
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
}
