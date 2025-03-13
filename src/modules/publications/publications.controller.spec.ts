import { Test, TestingModule } from '@nestjs/testing';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import {
  CreatePublicationDto,
  PublicationStatusDto,
  PublicationVisibilityDto,
  SectionDto,
  UpdateSectionDto,
} from './dtos/publication.dto';
import { authGuard } from '../../guards/auth.guard';
import { Visibility } from '@prisma/client';

describe('PublicationsController', () => {
  let controller: PublicationsController;
  let service: PublicationsService;

  // Mock authenticated user request
  const mockRequest = {
    user: {
      id: 'test-user-id',
    },
  };

  // Mock data for tests
  const mockPublication = {
    id: 'pub-123',
    title: 'Test Publication',
    abstract: 'Test Abstract',
    authorId: 'test-user-id',
  };

  const mockSection = {
    id: 'section-123',
    title: 'Test Section',
    content: 'Test Content',
    publicationId: 'pub-123',
  };

  const mockFile = {
    id: 'file-123',
    originalname: 'test.pdf',
    buffer: Buffer.from('test'),
    mimetype: 'application/pdf',
  } as unknown as Express.Multer.File;

  // Mock service implementation
  const mockPublicationsService = {
    createPublication: jest.fn(),
    getSinglePublication: jest.fn(),
    getAllPublicationsForUser: jest.fn(),
    changePublication: jest.fn(),
    changePublicationStatus: jest.fn(),
    changePublicationVisibility: jest.fn(),
    getAllPublications: jest.fn(),
    getPublication: jest.fn(),
    createSection: jest.fn(),
    getSingleSection: jest.fn(),
    updateSection: jest.fn(),
    addSectionFile: jest.fn(),
    deleteSectionFile: jest.fn(),
  };

  // Mock auth guard
  jest.mock('../../guards/auth.guard', () => ({
    authGuard: { canActivate: jest.fn().mockReturnValue(true) },
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicationsController],
      providers: [
        {
          provide: PublicationsService,
          useValue: mockPublicationsService,
        },
      ],
    })
      .overrideGuard(authGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PublicationsController>(PublicationsController);
    service = module.get<PublicationsService>(PublicationsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPublication', () => {
    it('should create a new publication', async () => {
      const createPublicationDto: CreatePublicationDto = {
        title: 'New Publication',
        abstract: 'New Abstract',
        keywords: ['test', 'publication'],
        language: 'en',
        categoryId: 'category-123',
        visibility: 'PUBLIC',
      };

      mockPublicationsService.createPublication.mockResolvedValue({
        id: 'new-pub-123',
        ...createPublicationDto,
        authorId: mockRequest.user.id,
      });

      const result = await controller.createPublication(
        mockRequest,
        createPublicationDto,
      );

      expect(service.createPublication).toHaveBeenCalledWith(
        mockRequest.user.id,
        createPublicationDto,
      );
      expect(result).toEqual({
        id: 'new-pub-123',
        ...createPublicationDto,
        authorId: mockRequest.user.id,
      });
    });
  });

  describe('getSinglePublication', () => {
    it('should get a single publication for the authenticated user', async () => {
      mockPublicationsService.getSinglePublication.mockResolvedValue(
        mockPublication,
      );

      const result = await controller.getSinglePublication(
        mockRequest,
        'pub-123',
      );

      expect(service.getSinglePublication).toHaveBeenCalledWith(
        mockRequest.user.id,
        'pub-123',
      );
      expect(result).toEqual(mockPublication);
    });
  });

  describe('getAllPublicationsForUser', () => {
    it('should get all publications for the authenticated user', async () => {
      const mockPublications = [mockPublication];
      mockPublicationsService.getAllPublicationsForUser.mockResolvedValue(
        mockPublications,
      );

      const result = await controller.getAllPublicationsForUser(mockRequest);

      expect(service.getAllPublicationsForUser).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
      expect(result).toEqual(mockPublications);
    });
  });

  describe('changePublication', () => {
    it('should update a publication', async () => {
      const updatePublicationDto: CreatePublicationDto = {
        title: 'Updated Publication',
        abstract: 'Updated Abstract',
        keywords: ['updated', 'publication'],
        language: 'fr',
        categoryId: 'category-456',
        visibility: 'PUBLIC',
      };

      mockPublicationsService.changePublication.mockResolvedValue({
        id: 'pub-123',
        ...updatePublicationDto,
        authorId: mockRequest.user.id,
      });

      const result = await controller.changePublication(
        mockRequest,
        'pub-123',
        updatePublicationDto,
      );

      expect(service.changePublication).toHaveBeenCalledWith(
        mockRequest.user.id,
        'pub-123',
        updatePublicationDto,
      );
      expect(result).toEqual({
        id: 'pub-123',
        ...updatePublicationDto,
        authorId: mockRequest.user.id,
      });
    });
  });

  describe('changePublicationStatus', () => {
    it('should change the status of a publication', async () => {
      const statusDto: PublicationStatusDto = {
        status: 'PUBLISHED',
      } as unknown as PublicationStatusDto;

      mockPublicationsService.changePublicationStatus.mockResolvedValue({
        ...mockPublication,
        status: 'PUBLISHED',
      });

      const result = await controller.changePublicationStatus(
        mockRequest,
        'pub-123',
        statusDto,
      );

      expect(service.changePublicationStatus).toHaveBeenCalledWith(
        mockRequest.user.id,
        'pub-123',
        statusDto,
      );
      expect(result).toEqual({
        ...mockPublication,
        status: 'PUBLISHED',
      });
    });
  });

  describe('changePublicationVisibility', () => {
    it('should change the visibility of a publication', async () => {
      const visibilityDto: PublicationVisibilityDto = {
        visibility: 'PUBLIC',
      } as unknown as PublicationVisibilityDto;

      mockPublicationsService.changePublicationVisibility.mockResolvedValue({
        ...mockPublication,
        visibility: 'PUBLIC',
      });

      const result = await controller.changePublicationVisibility(
        mockRequest,
        'pub-123',
        visibilityDto,
      );

      expect(service.changePublicationVisibility).toHaveBeenCalledWith(
        mockRequest.user.id,
        'pub-123',
        visibilityDto,
      );
      expect(result).toEqual({
        ...mockPublication,
        visibility: 'PUBLIC',
      });
    });
  });

  describe('getAllPublications', () => {
    it('should get all public publications', async () => {
      const mockPublications = [
        mockPublication,
        { ...mockPublication, id: 'pub-456', title: 'Another Publication' },
      ];
      mockPublicationsService.getAllPublications.mockResolvedValue(
        mockPublications,
      );

      const result = await controller.getAllPublications();

      expect(service.getAllPublications).toHaveBeenCalled();
      expect(result).toEqual(mockPublications);
    });
  });

  describe('getPublication', () => {
    it('should get a single public publication', async () => {
      mockPublicationsService.getPublication.mockResolvedValue(mockPublication);

      const result = await controller.getPublication('pub-123');

      expect(service.getPublication).toHaveBeenCalledWith('pub-123');
      expect(result).toEqual(mockPublication);
    });
  });

  describe('createSection', () => {
    it('should create a new section for a publication', async () => {
      const sectionDto: SectionDto = {
        title: 'New Section',
        content: 'New Content',
        publicationId: 'pub-123',
        orderIndex: '',
        type: 'TEXT',
      };

      const mockFiles = [mockFile];

      mockPublicationsService.createSection.mockResolvedValue({
        id: 'new-section-123',
        ...sectionDto,
        files: ['file-url-1'],
      });

      const result = await controller.createSection(
        mockRequest,
        sectionDto,
        mockFiles,
      );

      expect(service.createSection).toHaveBeenCalledWith(
        mockRequest.user.id,
        sectionDto,
        mockFiles,
      );
      expect(result).toEqual({
        id: 'new-section-123',
        ...sectionDto,
        files: ['file-url-1'],
      });
    });
  });

  describe('getSingleSection', () => {
    it('should get a single section for a publication', async () => {
      mockPublicationsService.getSingleSection.mockResolvedValue(mockSection);

      const result = await controller.getSingleSection(
        mockRequest,
        'section-123',
      );

      expect(service.getSingleSection).toHaveBeenCalledWith(
        mockRequest.user.id,
        'section-123',
      );
      expect(result).toEqual(mockSection);
    });
  });

  describe('updateSection', () => {
    it('should update a section for a publication', async () => {
      const updateSectionDto: UpdateSectionDto = {
        title: 'Updated Section',
        content: 'Updated Content',
        orderIndex: '',
        type: 'TEXT',
      };

      mockPublicationsService.updateSection.mockResolvedValue({
        ...mockSection,
        ...updateSectionDto,
      });

      const result = await controller.updateSection(
        mockRequest,
        'section-123',
        updateSectionDto,
      );

      expect(service.updateSection).toHaveBeenCalledWith(
        mockRequest.user.id,
        'section-123',
        updateSectionDto,
      );
      expect(result).toEqual({
        ...mockSection,
        ...updateSectionDto,
      });
    });
  });

  describe('addSectionFile', () => {
    it('should add a file to a section', async () => {
      mockPublicationsService.addSectionFile.mockResolvedValue({
        id: 'file-456',
        sectionId: 'section-123',
        url: 'file-url-2',
      });

      const result = await controller.addSectionFile(
        mockRequest,
        'section-123',
        mockFile,
      );

      expect(service.addSectionFile).toHaveBeenCalledWith(
        mockRequest.user.id,
        'section-123',
        mockFile,
      );
      expect(result).toEqual({
        id: 'file-456',
        sectionId: 'section-123',
        url: 'file-url-2',
      });
    });
  });

  describe('deleteSectionFile', () => {
    it('should delete a file from a section', async () => {
      mockPublicationsService.deleteSectionFile.mockResolvedValue({
        message: 'File deleted successfully',
      });

      const result = await controller.deleteSectionFile(
        mockRequest,
        'file-123',
      );

      expect(service.deleteSectionFile).toHaveBeenCalledWith(
        mockRequest.user.id,
        'file-123',
      );
      expect(result).toEqual({
        message: 'File deleted successfully',
      });
    });
  });
});
