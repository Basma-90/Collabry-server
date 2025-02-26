import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @ApiOperation({ summary: 'create user' })
  @ApiResponse({
    description: 'User created successfully',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
        email: {
          type: 'email',
          example: 'zeyad1@gmail.com',
        },
        password: {
          type: 'string',
          example: '12345678',
        },
      },
      required: ['email', 'password', 'avatar'],
    },
  })
  async create(
    @Body() user: { email: string; password: string },
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.usersService.create(user, avatar);
  }
}
