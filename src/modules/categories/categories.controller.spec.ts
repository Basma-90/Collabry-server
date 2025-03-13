import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/createCategory.dto';
import { authGuard } from '../../guards/auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

jest.mock('@nestjs/mongoose', () => ({
  getModelToken: jest
    .fn()
    .mockImplementation((modelName) => `${modelName}Model`),
}));

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockUser = {
    id: 'user123',
    roles: ['admin'],
  };

  const mockCategory = {
    id: 'category123',
    name: 'Test Category',
    description: 'Test Description',
  };

  const mockCreateCategoryDto: CreateCategoryDto = {
    name: 'Test Category',
    description: 'Test Description',
  };

  const mockPublications = [
    {
      id: 'publication1',
      title: 'Test Publication 1',
      categoryId: 'category123',
    },
    {
      id: 'publication2',
      title: 'Test Publication 2',
      categoryId: 'category123',
    },
  ];

  const mockCategoriesService = {
    createCategory: jest.fn().mockImplementation((userId, category) => {
      return {
        id: 'category123',
        ...category,
        userId,
      };
    }),
    getCategory: jest.fn().mockImplementation((id) => {
      return {
        id,
        ...mockCategory,
        children: [],
      };
    }),
    getCategoryPublications: jest.fn().mockImplementation((id) => {
      return mockPublications;
    }),
    updateCategory: jest
      .fn()
      .mockImplementation((userId, id, updateCategoryDto) => {
        return {
          id,
          ...updateCategoryDto,
          userId,
        };
      }),
    deleteCategory: jest.fn().mockImplementation((userId, id) => {
      return { message: 'Category deleted successfully' };
    }),
    getAllCategories: jest.fn().mockImplementation(() => {
      return [mockCategory];
    }),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: 'CategoryModel',
          useValue: {},
        },
      ],
    })
      .overrideGuard(authGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const req = { user: mockUser };
      const result = await controller.createCategory(
        req,
        mockCreateCategoryDto,
      );

      expect(service.createCategory).toHaveBeenCalledWith(
        mockUser.id,
        mockCreateCategoryDto,
      );
      expect(result).toEqual({
        id: 'category123',
        ...mockCreateCategoryDto,
        userId: mockUser.id,
      });
    });
  });

  describe('getCategory', () => {
    it('should return a category by id', async () => {
      const result = await controller.getCategory('category123');

      expect(service.getCategory).toHaveBeenCalledWith('category123');
      expect(result).toEqual({
        id: 'category123',
        ...mockCategory,
        children: [],
      });
    });
  });

  describe('getCategoryPublications', () => {
    it('should return publications for a category', async () => {
      const result = await controller.getCategoryPublications('category123');

      expect(service.getCategoryPublications).toHaveBeenCalledWith(
        'category123',
      );
      expect(result).toEqual(mockPublications);
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const req = { user: mockUser };
      const result = await controller.updateCategory(
        req,
        'category123',
        mockCreateCategoryDto,
      );

      expect(service.updateCategory).toHaveBeenCalledWith(
        mockUser.id,
        'category123',
        mockCreateCategoryDto,
      );
      expect(result).toEqual({
        id: 'category123',
        ...mockCreateCategoryDto,
        userId: mockUser.id,
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const req = { user: mockUser };
      const result = await controller.deleteCategory(req, 'category123');

      expect(service.deleteCategory).toHaveBeenCalledWith(
        mockUser.id,
        'category123',
      );
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const result = await controller.getAllCategories();

      expect(service.getAllCategories).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });
  });
});
