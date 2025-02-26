import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { CloudinaryService } from 'src/storage/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    // console.log(userId, 'getProfile');

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            bio: true,
            linkedin: true,
            expertise: true,
            languages: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    } else if (!user.profile) {
      return {
        email: user.email,
        profile: {
          firstName: '',
          lastName: '',
          profileImageUrl: '',
          bio: '',
          linkedin: '',
          expertise: [],
          languages: [],
        },
      };
    }
    return {
      email: user.email,
      profile: {
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        profileImageUrl: user.profile.profileImageUrl || '',
        bio: user.profile.bio || '',
        linkedin: user.profile.linkedin || '',
        expertise: user.profile.expertise || [],
        languages: user.profile.languages || [],
      },
    };
  }

  async updateProfile(userId: string, profileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        profile: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.profile) {
      await this.prisma.profile.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          firstName: profileDto.firstName,
          lastName: profileDto.lastName,
          bio: profileDto.bio,
          linkedin: profileDto.linkedin,
          expertise: {
            set: profileDto.expertise,
          },
          languages: {
            set: profileDto.languages,
          },
        },
      });
      return 'user profile updated successfully';
    } else {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          profile: {
            update: {
              firstName: profileDto.firstName,
              lastName: profileDto.lastName,

              bio: profileDto.bio,
              linkedin: profileDto.linkedin,
              expertise: {
                set: profileDto.expertise,
              },
              languages: {
                set: profileDto.languages,
              },
            },
          },
        },
      });
      return 'user profile updated successfully';
    }
  }

  async updateProfileImage(userId: string, image: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        profile: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const buffer = await this.cloudinaryService.uploadFile(image);
    if (buffer) {
      if (user.profile.profileImageUrl && user.profile.profileImagePublicId) {
        await this.cloudinaryService.deleteFile(
          user.profile.profileImagePublicId,
        );
      }
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          profile: {
            update: {
              profileImageUrl: buffer.url,
              profileImagePublicId: buffer.public_id,
            },
          },
        },
      });
    } else {
      throw new BadRequestException('Image upload failed');
    }
    return 'user profile image updated';
  }
}
