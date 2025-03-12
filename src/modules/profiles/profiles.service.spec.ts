import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/storage/cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;

  const mockUserId = 'user-123';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    profile: {
      id: 'profile-123',
      profileImageUrl: 'http://example.com/image.jpg',
      profileImagePublicId: 'public_id_123',
      bio: 'Test bio',
      linkedin: 'https://linkedin.com/in/testuser',
      expertise: ['JavaScript', 'Node.js'],
      languages: ['English', 'Spanish'],
    },
  };

  const mockUserWithoutProfile = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
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
    url: 'http://example.com/updated-image.jpg',
    public_id: 'public_id_456',
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
    it('should return user profile when profile exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUserId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
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
        email: mockUser.email,
        name: mockUser.name,
        profile: {
          profileImageUrl: mockUser.profile.profileImageUrl,
          bio: mockUser.profile.bio,
          linkedin: mockUser.profile.linkedin,
          expertise: mockUser.profile.expertise,
          languages: mockUser.profile.languages,
        },
      });
    });

    it('should return user with empty profile when profile does not exist', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithoutProfile);

      const result = await service.getProfile(mockUserId);

      expect(result).toEqual({
        email: mockUserWithoutProfile.email,
        name: mockUserWithoutProfile.name,
        profile: {
          profileImageUrl: '',
          bio: '',
          linkedin: '',
          expertise: [],
          languages: [],
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getProfile(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should create profile when it does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        name: 'Test User',
        profile: null,
      });

      jest.spyOn(prismaService.profile, 'create').mockResolvedValue({} as any);

      const result = await service.updateProfile(
        mockUserId,
        mockUpdateProfileDto,
      );

      expect(prismaService.profile.create).toHaveBeenCalledWith({
        data: {
          user: {
            connect: {
              id: mockUserId,
            },
          },
          bio: mockUpdateProfileDto.bio,
          linkedin: mockUpdateProfileDto.linkedin,
          expertise: {
            set: mockUpdateProfileDto.expertise,
          },
          languages: {
            set: mockUpdateProfileDto.languages,
          },
        },
      });

      expect(result).toEqual('user profile updated successfully');
    });

    it('should update profile when it exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        name: 'Test User',
        profile: {
          id: 'profile-123',
        },
      });

      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await service.updateProfile(
        mockUserId,
        mockUpdateProfileDto,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUserId,
        },
        data: {
          name: mockUpdateProfileDto.name,
          profile: {
            update: {
              bio: mockUpdateProfileDto.bio,
              linkedin: mockUpdateProfileDto.linkedin,
              expertise: {
                set: mockUpdateProfileDto.expertise,
              },
              languages: {
                set: mockUpdateProfileDto.languages,
              },
            },
          },
        },
      });

      expect(result).toEqual('user profile updated successfully');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProfile(mockUserId, mockUpdateProfileDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfileImage', () => {
    it('should update profile image and delete old image if it exists', async () => {
      // Fix: Include proper profile structure with both properties
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        profile: {
          profileImageUrl: 'http://example.com/old-image.jpg',
          profileImagePublicId: 'old_public_id',
        },
      });

      jest
        .spyOn(cloudinaryService, 'uploadFile')
        .mockResolvedValue(mockCloudinaryResponse);
      jest.spyOn(cloudinaryService, 'deleteFile').mockResolvedValue(undefined);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await service.updateProfileImage(mockUserId, mockFile);

      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'old_public_id',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUserId,
        },
        data: {
          profile: {
            update: {
              profileImageUrl: mockCloudinaryResponse.url,
              profileImagePublicId: mockCloudinaryResponse.public_id,
            },
          },
        },
      });

      expect(result).toEqual('user profile image updated');
    });

    it('should throw BadRequestException when image upload fails', async () => {
      // Fix: Include user ID and proper profile structure
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: mockUserId,
        profile: {
          profileImageUrl: null,
          profileImagePublicId: null,
        },
      });

      jest.spyOn(cloudinaryService, 'uploadFile').mockResolvedValue(null);

      await expect(
        service.updateProfileImage(mockUserId, mockFile),
      ).rejects.toThrow(BadRequestException);
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProfileImage(mockUserId, mockFile),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
