import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards ,Request} from '@nestjs/common';
import { authGuard } from 'src/guards/auth.guard';
import { BookmarkService } from './bookmarks.service';
import { UseInterceptors } from '@nestjs/common';
import { use } from 'passport';
import{TransformBookmarkInterceptor} from './interceptors/bookmarks.interceptor';
import { ApiProperty,ApiBody,ApiBadRequestResponse,ApiAcceptedResponse, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
    constructor(private bookmarkService: BookmarkService) {}

    @Get('/')
    @ApiOperation({summary:'Get all bookmarks'})
    @ApiResponse({status:200,description:'Bookmarks fetched successfully',})
    @ApiResponse({status:400,description:'Bad Request'})
    @UseGuards(authGuard)
    @UseInterceptors(TransformBookmarkInterceptor)
    async getUserBookmarks(@Request() req) {
        return await this.bookmarkService.getUserBookmarks(req.user.id);
    }

    @Post('/publications/:id')
    @ApiOperation({summary:'Create a bookmark'})
    @ApiResponse({status:201,description:'Bookmark created'})
    @ApiResponse({status:400,description:'Bad Request'})
    @UseGuards(authGuard)
    async createBookmark(@Param('id') publicationId: string, @Request() req) {
        return await this.bookmarkService.createBookmark(req.user.id, publicationId);
    }

    @Delete('/:id')
    @ApiOperation({summary:'Delete a bookmark'})
    @ApiResponse({status:200,description:'Bookmark deleted successfully'})
    @ApiResponse({status:400,description:'Bad Request'})
    @UseGuards(authGuard)
    async deleteBookmark(@Param('id') bookmarkId: string) {
        return await this.bookmarkService.deleteBookmark(bookmarkId);
    }

    @Delete('/user')
    @ApiOperation({summary:'Delete all bookmarks'})
    @ApiResponse({status:200,description:'All bookmarks deleted successfully'})
    @ApiResponse({status:400,description:'Bad Request'})
    @UseGuards(authGuard)
    async deleteAllBookmarks(@Request() req) {
        const userId = req.user.id;
        return await this.bookmarkService.deleteAllBookmarks(userId);
    }
}
