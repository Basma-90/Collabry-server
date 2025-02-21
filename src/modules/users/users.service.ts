import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CloudinaryService } from 'src/storage/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private generateWalletAddress(): string {
    // Generate a random 20-byte (40 character) hex string
    return '0x' + randomBytes(20).toString('hex');
  }

  async create(
    user: { email: string; password: string },
    avatar?: Express.Multer.File,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      let profileData;

      if (avatar) {
        const buffer = await this.cloudinaryService.uploadFile(avatar);
        if (buffer) {
          profileData = {
            profileImageUrl: buffer.url,
            profileImagePublicId: buffer.public_id,
          };
        }
      }

      // Generate a unique wallet address
      const walletAddress = this.generateWalletAddress();

      // Create user with nested creates for profile and token
      const newUser = await tx.user.create({
        data: {
          email: user.email,
          password: user.password,
          profile: profileData
            ? {
                create: profileData,
              }
            : undefined,
          token: {
            create: {
              walletAddress,
              tokenBalance: 0,
              reputation: 0,
            },
          },
        },
        include: {
          profile: true,
          token: true,
        },
      });

      return newUser;
    });
  }
}
