import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { authGuard } from 'src/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**-----------------------------------------------
 * @desc    toggle like publication
 * @route   /likes/publication/:id 
 * @method  Post
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Post('publication/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'toggle like publication' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleLike(@Req() req, @Param('id') id: string) {
    return await this.likesService.toggleLike(req.user.id, id);
  }

  /**-----------------------------------------------
 * @desc    get all likes for a user
 * @route   /likes/user/:id
 * @method  Get
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Get('user')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all likes for a user' })
  @ApiResponse({ status: 200, description: 'Likes fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserLikes(@Req() req) {
    return await this.likesService.getUserLikes(req.user.id);
  }

  /**-----------------------------------------------
 * @desc     remove like from publication
 * @route   /likes/publication/:id
 * @method  Delete
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Delete('publication/:id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove like from publication' })
  @ApiResponse({ status: 200, description: 'Like removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeLike(@Req() req, @Param('id') id: string) {
    return await this.likesService.removeLike(req.user.id, id);
  }
}
