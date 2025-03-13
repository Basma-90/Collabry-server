import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dtos/createCategory.dto';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';

jest.mock('mongodb', () => ({
  ObjectId: {
    isValid: jest.fn(),
  },
}));

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    (ObjectId.isValid as jest.Mock).mockReturnValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    const userId = 'admin-user-id';
    const createCategoryDto: CreateCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
    };

    it('should create a category successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        id: 'new-category-id',
        ...createCategoryDto,
      });

      const result = await service.createCategory(userId, createCategoryDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createCategoryDto),
      });
      expect(result).toEqual({ message: 'Category created successfully' });
    });

    it('should create a child category with parent ID', async () => {
      const createChildCategoryDto: CreateCategoryDto = {
        name: 'Child Category',
        description: 'Child Description',
        parentId: 'parent-id',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique
        .mockResolvedValueOnce({ id: 'parent-id' }) // Parent category exists
        .mockResolvedValueOnce(null); // Child category doesn't exist yet
      mockPrismaService.category.create.mockResolvedValue({
        id: 'new-child-id',
        ...createChildCategoryDto,
      });

      const result = await service.createCategory(
        userId,
        createChildCategoryDto,
      );

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-id' },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Child Category',
          description: 'Child Description',
          parent: { connect: { id: 'parent-id' } },
        },
      });
      expect(result).toEqual({ message: 'Category created successfully' });
    });

    it('should throw UnauthorizedException if user is not admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'USER',
      });

      await expect(
        service.createCategory(userId, createCategoryDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if category already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'existing-id',
        name: createCategoryDto.name,
      });

      await expect(
        service.createCategory(userId, createCategoryDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if parent ID is invalid', async () => {
      const invalidParentDto = { ...createCategoryDto, parentId: 'invalid-id' };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      (ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.createCategory(userId, invalidParentDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if parent category not found', async () => {
      const orphanDto = {
        ...createCategoryDto,
        parentId: 'non-existent-parent',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.createCategory(userId, orphanDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });
  });

  describe('getCategory', () => {
    const categoryId = 'valid-category-id';

    it('should return a category with its children', async () => {
      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description',
        children: [
          { id: 'child-1', name: 'Child 1' },
          { id: 'child-2', name: 'Child 2' },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.getCategory(categoryId);

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: { children: true },
      });
      expect(result).toEqual({
        id: categoryId,
        name: 'Test Category',
        children: mockCategory.children,
      });
    });

    it('should throw BadRequestException if category ID is invalid', async () => {
      (ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      await expect(service.getCategory('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.category.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getCategory(categoryId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCategoryPublications', () => {
    const categoryId = 'valid-category-id';

    it('should return publications for a category', async () => {
      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        publications: [
          {
            id: 'pub-1',
            title: 'Publication 1',
            abstract: 'Abstract 1',
            keywords: ['keyword1', 'keyword2'],
            language: 'en',
          },
          {
            id: 'pub-2',
            title: 'Publication 2',
            abstract: 'Abstract 2',
            keywords: ['keyword3'],
            language: 'fr',
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.getCategoryPublications(categoryId);

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: { publications: true },
      });
      expect(result).toEqual([
        {
          id: 'pub-1',
          title: 'Publication 1',
          abstract: 'Abstract 1',
          keywords: ['keyword1', 'keyword2'],
          language: 'en',
        },
        {
          id: 'pub-2',
          title: 'Publication 2',
          abstract: 'Abstract 2',
          keywords: ['keyword3'],
          language: 'fr',
        },
      ]);
    });

    it('should throw BadRequestException if category ID is invalid', async () => {
      (ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.getCategoryPublications('invalid-id'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.category.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryPublications(categoryId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCategory', () => {
    const userId = 'admin-user-id';
    const categoryId = 'valid-category-id';
    const updateCategoryDto: CreateCategoryDto = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('should update a category successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: categoryId,
        name: 'Old Name',
      });
      mockPrismaService.category.update.mockResolvedValue({
        id: categoryId,
        ...updateCategoryDto,
      });

      const result = await service.updateCategory(
        userId,
        categoryId,
        updateCategoryDto,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: expect.objectContaining(updateCategoryDto),
      });
      expect(result).toEqual({ message: 'Category updated successfully' });
    });

    it('should update a category with new parent ID', async () => {
      const updateWithParentDto = {
        ...updateCategoryDto,
        parentId: 'new-parent-id',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique
        .mockResolvedValueOnce({ id: 'new-parent-id' }) // Parent exists
        .mockResolvedValueOnce({ id: categoryId }); // Category exists
      mockPrismaService.category.update.mockResolvedValue({
        id: categoryId,
        ...updateWithParentDto,
      });

      const result = await service.updateCategory(
        userId,
        categoryId,
        updateWithParentDto,
      );

      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: {
          name: 'Updated Category',
          description: 'Updated Description',
          parent: { connect: { id: 'new-parent-id' } },
        },
      });
      expect(result).toEqual({ message: 'Category updated successfully' });
    });

    it('should throw UnauthorizedException if user is not admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'USER',
      });

      await expect(
        service.updateCategory(userId, categoryId, updateCategoryDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if category ID is invalid', async () => {
      (ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.updateCategory(userId, 'invalid-id', updateCategoryDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCategory(userId, categoryId, updateCategoryDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    const userId = 'admin-user-id';
    const categoryId = 'valid-category-id';

    it('should delete a category successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: categoryId,
        name: 'Category to Delete',
      });
      mockPrismaService.category.delete.mockResolvedValue({
        id: categoryId,
      });

      const result = await service.deleteCategory(userId, categoryId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it('should throw UnauthorizedException if user is not admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'USER',
      });

      await expect(service.deleteCategory(userId, categoryId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if category ID is invalid', async () => {
      (ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.deleteCategory(userId, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategory(userId, categoryId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Category 1' },
        { id: 'cat-2', name: 'Category 2' },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getAllCategories();

      expect(mockPrismaService.category.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it('should throw NotFoundException if no categories found', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      await expect(service.getAllCategories()).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
