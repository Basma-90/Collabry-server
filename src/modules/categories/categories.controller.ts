import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { authGuard } from 'src/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateCategoryDto } from './dtos/createCategory.dto';
import { Request } from 'express';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**-----------------------------------------------
 * @desc    create a new category
 * @route   /categories/create
 * @method  Post
 * @access  for authenticated admin 
 ------------------------------------------------*/
  @Post('create')
  @UseGuards(authGuard)
  //   @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCategory(
    @Req() req,
    @Body()
    category: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(req.user.id, category);
  }

  /**-----------------------------------------------
 * @desc    get a sinlge category + childrens
 * @route   /categories/:id
 * @method  Get
 * @access  public 
 ------------------------------------------------*/
  @Get(':id')
  @ApiOperation({ summary: 'Get a single category' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id') id: string) {
    return this.categoriesService.getCategory(id);
  }

  /**-----------------------------------------------
 * @desc    get a publications of category
 * @route   /categories/publications/:id
 * @method  Get
 * @access  public 
 ------------------------------------------------*/
  @Get('publications/:id')
  @ApiOperation({ summary: 'Get a publications of category' })
  @ApiResponse({ status: 200, description: 'Publications found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryPublications(@Param('id') id: string) {
    return this.categoriesService.getCategoryPublications(id);
  }

  /**-----------------------------------------------
 * @desc    update a category
 * @route   /categories/:id
 * @method  Put
 * @access  for authenticated admin 
 ------------------------------------------------*/
  @Put(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCategory(
    @Req() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(
      req.user.id,
      id,
      updateCategoryDto,
    );
  }

  /**-----------------------------------------------
 * @desc    delete a category
 * @route   /categories/:id
 * @method  Delete
 * @access  for authenticated admin 
 ------------------------------------------------*/
  @Delete(':id')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteCategory(@Req() req, @Param('id') id: string) {
    return await this.categoriesService.deleteCategory(req.user.id, id);
  }

  /**-----------------------------------------------
 * @desc    get all categories
 * @route   /categories/
 * @method  Get
 * @access  public 
 ------------------------------------------------*/
  @Get('')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories found' })
  @ApiResponse({ status: 404, description: 'No categories found' })
  async getAllCategories() {
    return await this.categoriesService.getAllCategories();
  }

  /**-----------------------------------------------
 * @desc    get a category tree
 * @route   /categories/tree
 * @method  Get
 * @access  public
// //  ------------------------------------------------*/
  //   @Get('tree')
  //   @ApiOperation({ summary: 'Get a category tree' })
  //   @ApiResponse({ status: 200, description: 'Category tree found' })
  //   async getCategoryTree() {
  //     return await this.categoriesService.getCategoryTree();
  //   }
}
