import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../storage/cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;

  const mockUserWithProfile = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: 'refresh-token',
    isEmailVerified: true,
    profile: {
      id: 'profile-123',
      profileImageUrl: 'http://example.com/image.jpg',
      bio: 'Test bio',
      linkedin: 'https://linkedin.com/in/testuser',
      expertise: ['JavaScript', 'Node.js'],
      languages: ['English', 'Spanish'],
      profileImagePublicId: 'public-id-123',
    },
  };

  const mockUserWithoutProfile = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: 'refresh-token',
    isEmailVerified: true,
    profile: null,
  };

  const mockUpdateProfileDto: UpdateProfileDto = {
    name: 'Updated Name',
    bio: 'Updated bio',
    linkedin: 'https://linkedin.com/in/updateduser',
    expertise: ['TypeScript', 'NestJS'],
    languages: ['English', 'French'],
  };

  const mockFile = {
    fieldname: 'avatar',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
  } as Express.Multer.File;

  const mockCloudinaryResponse = {
    url: 'new-url',
    public_id: 'new-public-id',
    message: '',
    name: '',
    http_code: 200,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            profile: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    prismaService = module.get<PrismaService>(PrismaService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile when user and profile exist', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithProfile);

      const result = await service.getProfile('user-123');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          name: true,
          profile: {
            select: {
              id: true,
              profileImageUrl: true,
              bio: true,
              linkedin: true,
              expertise: true,
              languages: true,
            },
          },
        },
      });
      expect(result).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        profile: {
          profileImageUrl: 'http://example.com/image.jpg',
          bio: 'Test bio',
          linkedin: 'https://linkedin.com/in/testuser',
          expertise: ['JavaScript', 'Node.js'],
          languages: ['English', 'Spanish'],
        },
      });
    });

    it('should return default profile when user exists but profile does not', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithoutProfile);

      const result = await service.getProfile('user-123');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          name: true,
          profile: {
            select: {
              id: true,
              profileImageUrl: true,
              bio: true,
              linkedin: true,
              expertise: true,
              languages: true,
            },
          },
        },
      });
      expect(result).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        profile: {
          profileImageUrl: '',
          bio: '',
          linkedin: '',
          expertise: [],
          languages: [],
        },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getProfile('user-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should create profile and return success message when profile does not exist', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithoutProfile);
      jest.spyOn(prismaService.profile, 'create').mockResolvedValue({} as any);

      const result = await service.updateProfile(
        'user-123',
        mockUpdateProfileDto,
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          name: true,
          profile: true,
        },
      });
      expect(prismaService.profile.create).toHaveBeenCalledWith({
        data: {
          user: {
            connect: {
              id: 'user-123',
            },
          },
          bio: 'Updated bio',
          linkedin: 'https://linkedin.com/in/updateduser',
          expertise: {
            set: ['TypeScript', 'NestJS'],
          },
          languages: {
            set: ['English', 'French'],
          },
        },
      });
      expect(result).toEqual('user profile updated successfully');
    });

    it('should update profile and return success message when profile exists', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithProfile);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await service.updateProfile(
        'user-123',
        mockUpdateProfileDto,
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          name: true,
          profile: true,
        },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: 'Updated Name',
          profile: {
            update: {
              bio: 'Updated bio',
              linkedin: 'https://linkedin.com/in/updateduser',
              expertise: {
                set: ['TypeScript', 'NestJS'],
              },
              languages: {
                set: ['English', 'French'],
              },
            },
          },
        },
      });
      expect(result).toEqual('user profile updated successfully');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProfile('user-123', mockUpdateProfileDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfileImage', () => {
    it('should update profile image and return success message', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithProfile);
      jest
        .spyOn(cloudinaryService, 'uploadFile')
        .mockResolvedValue(mockCloudinaryResponse);
      jest
        .spyOn(cloudinaryService, 'deleteFile')
        .mockResolvedValue(mockCloudinaryResponse);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await service.updateProfileImage('user-123', mockFile);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          profile: true,
        },
      });
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'public-id-123',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          profile: {
            update: {
              profileImageUrl: 'new-url',
              profileImagePublicId: 'new-public-id',
            },
          },
        },
      });
      expect(result).toEqual('user profile image updated');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProfileImage('user-123', mockFile),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when image upload fails', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithProfile);
      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue(null);

      await expect(
        service.updateProfileImage('user-123', mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
