import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { authGuard } from '../../guards/auth.guard';
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
    })
      .overrideGuard(authGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfileData);

      const result = await controller.getProfile(mockRequest);

      expect(service.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(mockProfileData);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
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
    it('should return success message when profile is updated', async () => {
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

    it('should throw UnauthorizedException when user does not exist', async () => {
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

    it('should throw BadRequestException when profile data is invalid', async () => {
      const invalidDto = { ...mockUpdateProfileDto, linkedin: 'invalid-url' };
      jest
        .spyOn(service, 'updateProfile')
        .mockRejectedValue(new BadRequestException('Invalid profile data'));

      await expect(
        controller.updateProfile(mockRequest, invalidDto),
      ).rejects.toThrow(BadRequestException);
      expect(service.updateProfile).toHaveBeenCalledWith(
        mockRequest.user.id,
        invalidDto,
      );
    });
  });

  describe('updateProfileImage', () => {
    it('should return success message when profile image is updated', async () => {
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

    it('should throw UnauthorizedException when user does not exist', async () => {
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

    it('should throw BadRequestException when file upload fails', async () => {
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

    it('should throw BadRequestException when no file is provided', async () => {
      jest
        .spyOn(service, 'updateProfileImage')
        .mockRejectedValue(new BadRequestException('No file provided'));

      await expect(
        controller.updateProfileImage(mockRequest, null),
      ).rejects.toThrow(BadRequestException);
      expect(service.updateProfileImage).toHaveBeenCalledWith(
        mockRequest.user.id,
        null,
      );
    });
  });
});
