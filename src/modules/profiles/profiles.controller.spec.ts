import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockProfileData = {
    email: 'test@example.com',
    name: 'Test User',
    profile: {
      profileImageUrl: 'http://example.com/image.jpg',
      bio: 'Test bio',
      linkedin: 'https://linkedin.com/in/testuser',
      expertise: ['JavaScript', 'Node.js'],
      languages: ['English', 'Spanish'],
    },
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

  const mockRequest = {
    user: {
      id: 'user-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            updateProfileImage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfileData);

      const result = await controller.getProfile(mockRequest);

      expect(service.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(mockProfileData);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest
        .spyOn(service, 'getProfile')
        .mockRejectedValue(new UnauthorizedException());

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const successMessage = 'user profile updated successfully';
      jest.spyOn(service, 'updateProfile').mockResolvedValue(successMessage);

      const result = await controller.updateProfile(
        mockRequest,
        mockUpdateProfileDto,
      );

      expect(service.updateProfile).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockUpdateProfileDto,
      );
      expect(result).toEqual(successMessage);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest
        .spyOn(service, 'updateProfile')
        .mockRejectedValue(new UnauthorizedException());

      await expect(
        controller.updateProfile(mockRequest, mockUpdateProfileDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.updateProfile).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockUpdateProfileDto,
      );
    });
  });

  describe('updateProfileImage', () => {
    it('should update profile image successfully', async () => {
      const successMessage = 'user profile image updated';
      jest
        .spyOn(service, 'updateProfileImage')
        .mockResolvedValue(successMessage);

      const result = await controller.updateProfileImage(mockRequest, mockFile);

      expect(service.updateProfileImage).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockFile,
      );
      expect(result).toEqual(successMessage);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest
        .spyOn(service, 'updateProfileImage')
        .mockRejectedValue(new UnauthorizedException());

      await expect(
        controller.updateProfileImage(mockRequest, mockFile),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.updateProfileImage).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockFile,
      );
    });

    it('should throw BadRequestException when image upload fails', async () => {
      jest
        .spyOn(service, 'updateProfileImage')
        .mockRejectedValue(new BadRequestException('Image upload failed'));

      await expect(
        controller.updateProfileImage(mockRequest, mockFile),
      ).rejects.toThrow(BadRequestException);
      expect(service.updateProfileImage).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockFile,
      );
    });
  });
});
