import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { AuthGuard } from 'src/common/gurads/auth.guard';
import { RolesGuard } from 'src/common/gurads/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profileService: ProfilesService) {}

  /**-----------------------------------------------
 * @desc    get user profile
 * @route   /profiles/profile
 * @method  Get
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Get('profile')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req) {
    return await this.profileService.getProfile(req.user.id);
  }

  /**-----------------------------------------------
 * @desc    update user profile
 * @route   /profiles/profile
 * @method  Put
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Put('profile')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return await this.profileService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
  }

  /**-----------------------------------------------
 * @desc    update user profile image
 * @route   /profiles/profile/avatar
 * @method  Patch
 * @access  for authenticated user 
 ------------------------------------------------*/
  @Patch('profile/avatar')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile image' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['avatar'],
    },
  })
  async updateProfileImage(
    @Req() req,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return await this.profileService.updateProfileImage(req.user.id, avatar);
  }
}
