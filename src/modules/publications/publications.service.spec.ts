import { Test, TestingModule } from '@nestjs/testing';
import { PublicationsService } from './publications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  UserRole,
  PublicationStatus,
  Visibility,
  SectionType,
} from '@prisma/client';

describe('PublicationsService', () => {
  let service: PublicationsService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;

  // Mock data
  const mockUserId = 'user-id-1';
  const mockPublicationId = 'pub-id-1';
  const mockSectionId = 'section-id-1';
  const mockFileId = 'file-id-1';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: 'refresh-token',
    isEmailVerified: true,
  };

  const mockCategory = {
    id: 'category-id-1',
    name: 'Science',
    parentId: 'parent-id-1',
    description: 'Science category description',
  };

  const mockPublication = {
    id: mockPublicationId,
    title: 'Test Publication',
    abstract: 'Test Abstract',
    keywords: ['test', 'publication'],
    language: 'EN',
    visibility: Visibility.PRIVATE,
    status: PublicationStatus.DRAFT,
    authorId: mockUserId,
    categoryId: 'category-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    views: 0,
    citations: 0,
    ipfsHash: 'ipfs-hash',
    author: mockUser,
    category: mockCategory,
    sections: [],
    collaborations: [],
  };

  const mockSection = {
    id: mockSectionId,
    title: 'Test Section',
    orderIndex: 1,
    type: SectionType.TEXT,
    content: 'Test content',
    publicationId: mockPublicationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    publication: {
      ...mockPublication,
      collaborations: [],
    },
    files: [],
  };

  const mockSectionFile = {
    id: mockFileId,
    url: 'http://example.com/file.pdf',
    publicId: 'public-id-1',
    sectionId: mockSectionId,
    createdAt: new Date(),
    updatedAt: new Date(),
    section: {
      ...mockSection,
      publication: {
        ...mockPublication,
        collaborations: [],
      },
    },
  };

  const mockCreatePublicationDto = {
    title: 'New Publication',
    abstract: 'New Abstract',
    keywords: ['new', 'publication'],
    language: 'EN',
    visibility: Visibility.PRIVATE,
    categoryId: 'category-id-1',
  };

  const mockSectionDto = {
    title: 'New Section',
    orderIndex: '1',
    type: SectionType.TEXT,
    content: 'New content',
    publicationId: mockPublicationId,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicationsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            category: {
              findUnique: jest.fn(),
            },
            publication: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            section: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            sectionFile: {
              create: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadFiles: jest.fn(),
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PublicationsService>(PublicationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPublication', () => {
    it('should create a publication successfully', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.publication, 'create')
        .mockResolvedValue(mockPublication);

      // Act
      const result = await service.createPublication(
        mockUserId,
        mockCreatePublicationDto,
      );

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreatePublicationDto.categoryId },
      });
      expect(prismaService.publication.create).toHaveBeenCalledWith({
        data: {
          title: mockCreatePublicationDto.title,
          abstract: mockCreatePublicationDto.abstract,
          keywords: mockCreatePublicationDto.keywords,
          language: mockCreatePublicationDto.language,
          visibility: mockCreatePublicationDto.visibility,
          authorId: mockUserId,
          categoryId: mockCreatePublicationDto.categoryId,
        },
      });
      expect(result).toBe('Publication created successfully');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPublication(mockUserId, mockCreatePublicationDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw UnauthorizedException if category not found', async () => {
      // Arrange
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPublication(mockUserId, mockCreatePublicationDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreatePublicationDto.categoryId },
      });
    });
  });

  describe('getSinglePublication', () => {
    it('should get a publication if user is the owner', async () => {
      // Arrange
      const mockPubWithDetails = {
        ...mockPublication,
        author: {
          id: mockUserId,
          email: 'test@example.com',
          name: 'Test User',
        },
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            orderIndex: 1,
            type: SectionType.TEXT,
            content: 'Content 1',
            files: [],
          },
        ],
      };

      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(mockPubWithDetails);

      // Act
      const result = await service.getSinglePublication(
        mockUserId,
        mockPublicationId,
      );

      // Assert
      expect(prismaService.publication.findUnique).toHaveBeenCalledWith({
        where: { id: mockPublicationId },
        include: expect.any(Object),
      });
      expect(result).toHaveProperty('id', mockPublicationId);
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('authorId', mockUserId);
    });

    it('should throw NotFoundException if publication not found', async () => {
      // Arrange
      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getSinglePublication(mockUserId, mockPublicationId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user has no access', async () => {
      // Arrange
      const mockPubWithDifferentOwner = {
        ...mockPublication,
        authorId: 'different-user-id',
        collaborations: [],
      };

      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(mockPubWithDifferentOwner);

      // Act & Assert
      await expect(
        service.getSinglePublication(mockUserId, mockPublicationId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access if user is a collaborator', async () => {
      // Arrange
      const mockPubWithCollaboration = {
        ...mockPublication,
        authorId: 'different-user-id',
        collaborations: [
          {
            id: 'collab-1',
            userId: mockUserId,
            status: 'ACCEPTED',
            user: {
              id: mockUserId,
              email: 'test@example.com',
              name: 'Test User',
              role: UserRole.USER,
            },
          },
        ],
        author: {
          id: 'different-user-id',
          email: 'author@example.com',
          name: 'Author User',
        },
        sections: [],
      };

      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(mockPubWithCollaboration);

      // Act
      const result = await service.getSinglePublication(
        mockUserId,
        mockPublicationId,
      );

      // Assert
      expect(result).toHaveProperty('id', mockPublicationId);
      expect(result).toHaveProperty('collaborators');
      expect(result.collaborators.length).toBe(1);
    });
  });

  describe('getAllPublicationsForUser', () => {
    it('should return all publications for a user', async () => {
      // Arrange
      const mockAuthoredPubs = [
        { ...mockPublication, id: 'pub-1' },
        { ...mockPublication, id: 'pub-2' },
      ];

      const mockCollaboratedPubs = [
        { ...mockPublication, id: 'pub-3', authorId: 'other-user' },
      ];

      jest
        .spyOn(prismaService.publication, 'findMany')
        .mockResolvedValueOnce(mockAuthoredPubs)
        .mockResolvedValueOnce(mockCollaboratedPubs);

      // Act
      const result = await service.getAllPublicationsForUser(mockUserId);

      // Assert
      expect(prismaService.publication.findMany).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(3);
      expect(result.some((pub) => pub.id === 'pub-1')).toBeTruthy();
      expect(result.some((pub) => pub.id === 'pub-2')).toBeTruthy();
      expect(result.some((pub) => pub.id === 'pub-3')).toBeTruthy();
    });
  });

  describe('createSection', () => {
    it('should create a section successfully', async () => {
      // Arrange
      const mockFiles = [
        { filename: 'test.pdf' },
      ] as unknown as Express.Multer.File[];
      const mockPubWithUserAsOwner = {
        ...mockPublication,
        sections: [],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(mockPubWithUserAsOwner);
      jest
        .spyOn(prismaService.section, 'create')
        .mockResolvedValue(mockSection);
      jest
        .spyOn(cloudinaryService, 'uploadFiles')
        .mockResolvedValue([
          {
            url: 'http://example.com/file.pdf',
            public_id: 'public-id-1',
            message: '',
            name: '',
            http_code: 200,
          },
        ]);
      jest
        .spyOn(prismaService.sectionFile, 'create')
        .mockResolvedValue(mockSectionFile);

      // Act
      const result = await service.createSection(
        mockUserId,
        mockSectionDto,
        mockFiles,
      );

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(prismaService.publication.findUnique).toHaveBeenCalledWith({
        where: { id: mockSectionDto.publicationId },
        include: expect.any(Object),
      });
      expect(prismaService.section.create).toHaveBeenCalledWith({
        data: {
          title: mockSectionDto.title,
          orderIndex: parseInt(mockSectionDto.orderIndex),
          type: mockSectionDto.type,
          content: mockSectionDto.content,
          publication: {
            connect: {
              id: mockSectionDto.publicationId,
            },
          },
        },
      });
      expect(cloudinaryService.uploadFiles).toHaveBeenCalledWith(mockFiles);
      expect(prismaService.sectionFile.create).toHaveBeenCalled();
      expect(result).toBe('Section created successfully');
    });

    it('should throw ConflictException if section with same order exists', async () => {
      // Arrange
      const mockPubWithExistingSection = {
        ...mockPublication,
        sections: [
          {
            id: 'existing-section',
            orderIndex: parseInt(mockSectionDto.orderIndex),
            title: 'Existing Section',
          },
        ],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(mockPubWithExistingSection);

      // Act & Assert
      await expect(
        service.createSection(mockUserId, mockSectionDto, []),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getSingleSection', () => {
    it('should get a section if user has access', async () => {
      // Arrange
      const mockSectionWithPub = {
        ...mockSection,
        publication: {
          ...mockPublication,
          authorId: mockUserId,
          collaborations: [],
        },
      };

      jest
        .spyOn(prismaService.section, 'findUnique')
        .mockResolvedValue(mockSectionWithPub);

      // Act
      const result = await service.getSingleSection(mockUserId, mockSectionId);

      // Assert
      expect(prismaService.section.findUnique).toHaveBeenCalledWith({
        where: { id: mockSectionId },
        include: expect.any(Object),
      });
      expect(result).toHaveProperty('id', mockSectionId);
      expect(result).toHaveProperty('title', mockSection.title);
    });

    it('should throw NotFoundException if section not found', async () => {
      // Arrange
      jest.spyOn(prismaService.section, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getSingleSection(mockUserId, mockSectionId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublication', () => {
    it('should get a public published publication', async () => {
      // Arrange
      const mockPublicPub = {
        ...mockPublication,
        visibility: Visibility.PUBLIC,
        status: PublicationStatus.PUBLISHED,
      };

      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(mockPublicPub);

      // Act
      const result = await service.getPublication(mockPublicationId);

      // Assert
      expect(prismaService.publication.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockPublicationId,
          visibility: Visibility.PUBLIC,
          status: PublicationStatus.PUBLISHED,
        },
        include: expect.any(Object),
      });
      expect(result).toHaveProperty('id', mockPublicationId);
    });

    it('should throw NotFoundException if public publication not found', async () => {
      // Arrange
      jest
        .spyOn(prismaService.publication, 'findUnique')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPublication(mockPublicationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteSectionFile', () => {
    it('should delete a section file if user has permission', async () => {
      // Arrange
      const mockFileWithOwnerAccess = {
        ...mockSectionFile,
        section: {
          ...mockSection,
          publication: {
            ...mockPublication,
            authorId: mockUserId,
          },
        },
      };

      jest
        .spyOn(prismaService.sectionFile, 'findUnique')
        .mockResolvedValue(mockFileWithOwnerAccess);
      jest.spyOn(cloudinaryService, 'deleteFile').mockResolvedValue(undefined);
      jest
        .spyOn(prismaService.sectionFile, 'delete')
        .mockResolvedValue(mockSectionFile);

      // Act
      const result = await service.deleteSectionFile(mockUserId, mockFileId);

      // Assert
      expect(prismaService.sectionFile.findUnique).toHaveBeenCalledWith({
        where: { id: mockFileId },
        include: expect.any(Object),
      });
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        mockSectionFile.publicId,
      );
      expect(prismaService.sectionFile.delete).toHaveBeenCalledWith({
        where: { id: mockFileId },
      });
      expect(result).toBe('File deleted successfully');
    });

    it('should throw UnauthorizedException if user has no permission', async () => {
      // Arrange
      const mockFileWithDifferentOwner = {
        ...mockSectionFile,
        section: {
          ...mockSection,
          publication: {
            ...mockPublication,
            authorId: 'different-user-id',
            collaborations: [],
          },
        },
      };

      jest
        .spyOn(prismaService.sectionFile, 'findUnique')
        .mockResolvedValue(mockFileWithDifferentOwner);

      // Act & Assert
      await expect(
        service.deleteSectionFile(mockUserId, mockFileId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllPublications', () => {
    it('should return all public published publications', async () => {
      // Arrange
      const mockPublicPublications = [
        {
          ...mockPublication,
          visibility: Visibility.PUBLIC,
          status: PublicationStatus.PUBLISHED,
        },
      ];

      jest
        .spyOn(prismaService.publication, 'findMany')
        .mockResolvedValue(mockPublicPublications);

      // Act
      const result = await service.getAllPublications();

      // Assert
      expect(prismaService.publication.findMany).toHaveBeenCalledWith({
        where: {
          visibility: Visibility.PUBLIC,
          status: PublicationStatus.PUBLISHED,
        },
        include: expect.any(Object),
      });
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('id', mockPublicationId);
    });
  });
});
