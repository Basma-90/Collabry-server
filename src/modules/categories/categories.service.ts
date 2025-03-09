import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dtos/createCategory.dto';
import { ObjectId } from 'mongodb';

export interface CategoryTreeNode {
  id: string;
  name: string;
  description: string;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(userId: string, createCategoryDto: CreateCategoryDto) {
    const admin = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admin can create a category');
    }

    const { parentId, ...categoryData } = createCategoryDto;

    if (parentId) {
      if (!ObjectId.isValid(parentId)) {
        throw new BadRequestException('Parent category ID is invalid');
      }

      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }
    }

    const category = await this.prisma.category.findUnique({
      where: { name: categoryData.name },
    });

    if (category) {
      throw new BadRequestException('Category already exists');
    }

    await this.prisma.category.create({
      data: {
        ...categoryData,
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
    });

    return { message: 'Category created successfully' };
  }

  async getCategory(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Category ID is invalid');
    }
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      children: category.children,
    };
  }

  async getCategoryPublications(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Category ID is invalid');
    }
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { publications: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category.publications.map((publication) => ({
      id: publication.id,
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords,
      language: publication.language,
    }));
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    updateCategoryDto: CreateCategoryDto,
  ) {
    if (!ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Category ID is invalid');
    }
    const admin = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admin can update a category');
    }

    const { parentId, ...categoryData } = updateCategoryDto;

    // Validate parent category if parentId is provided
    if (!ObjectId.isValid(parentId)) {
      throw new BadRequestException('Parent category ID is invalid');
    }
    if (parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...categoryData,
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
    });

    return { message: 'Category updated successfully' };
  }

  async deleteCategory(userId: string, categoryId: string) {
    if (!ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Category ID is invalid');
    }
    const admin = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!admin || admin.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admin can delete a category');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.prisma.category.delete({ where: { id: categoryId } });
    return { message: 'Category deleted successfully' };
  }

  async getAllCategories() {
    const categories = await this.prisma.category.findMany();

    if (categories.length === 0) {
      throw new NotFoundException('No categories found');
    }

    return categories;
  }

  // async getCategoryTree() {
  //   const categories = await this.prisma.category.findMany({
  //     include: { children: true },
  //   });

  //   if (!categories) {
  //     throw new NotFoundException('No categories found');
  //   }

  //   const rootCategories = await this.prisma.category.findMany({
  //     where: {
  //       parentId: null,
  //     },
  //   });

  //   const categoryTree = await Promise.all(
  //     rootCategories.map(async (rootCategory) => {
  //       return this.buildCategorySubtree(rootCategory.id);
  //     }),
  //   );

  //   return categoryTree;
  // }

  // async buildCategorySubtree(categoryId: string): Promise<CategoryTreeNode> {
  //   // Get the category with its immediate children
  //   const category = await this.prisma.category.findUnique({
  //     where: {
  //       id: categoryId,
  //     },
  //     include: {
  //       children: true,
  //     },
  //   });

  //   if (!category) {
  //     throw new Error(`Category with ID ${categoryId} not found`);
  //   }

  //   // Recursively build the subtree for each child
  //   const children = await Promise.all(
  //     category.children.map(async (child) => {
  //       return this.buildCategorySubtree(child.id);
  //     }),
  //   );

  //   // Return the category with its children
  //   return {
  //     id: category.id,
  //     name: category.name,
  //     description: category.description,
  //     children,
  //   };
  // }
}
