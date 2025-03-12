// src/modules/tokens/tokens.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTokenDto } from './dtos/create-token.dto';
import { UpdateTokenDto } from './dtos/update-token.dto';
import { TokenQueryDto } from './dtos/token-query.dto';
import { TokenTransactionDto } from './dtos/token-transaction.dto';
import { UserRole } from '@prisma/client';
import { ethers } from 'ethers';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createToken(userId: string, createTokenDto: CreateTokenDto) {
    this.logger.debug(`Creating token for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const targetUserId =
      user.role === UserRole.ADMIN && createTokenDto.userId
        ? createTokenDto.userId
        : userId;

    const existingToken = await this.prisma.token.findUnique({
      where: { userId: targetUserId },
    });

    if (existingToken) {
      return {
        message: 'Token already exists for this user',
        token: existingToken,
      };
    }

    const walletAddress =
      createTokenDto.walletAddress || this.generateWalletAddress();

    const newToken = await this.prisma.token.create({
      data: {
        userId: targetUserId,

        walletAddress,
      },
    });

    return {
      message: 'Token created successfully',
      token: newToken,
    };
  }
  private generateWalletAddress(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.address;
  }

  async findTokenByUserId(authUserId: string, userId: string) {
    const authUser = await this.prisma.user.findUnique({
      where: { id: authUserId },
    });

    if (
      !authUser ||
      (authUser.role !== UserRole.ADMIN && authUser.id !== userId)
    ) {
      throw new UnauthorizedException('Unauthorized to access this endpoint');
    }

    const token = await this.prisma.token.findUnique({
      where: { userId },
    });

    if (!token) {
      throw new NotFoundException(`Token not found for user: ${userId}`);
    }

    return token;
  }

  async updateToken(
    adminId: string,
    userId: string,
    updateTokenDto: UpdateTokenDto,
  ) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admin can update tokens');
    }

    const token = await this.prisma.token.findUnique({
      where: { userId },
    });

    if (!token) {
      throw new NotFoundException(`Token not found for user: ${userId}`);
    }

    return this.prisma.token.update({
      where: { userId },
      data: updateTokenDto,
    });
  }

  async createTransaction(userId: string, transactionDto: TokenTransactionDto) {
    this.logger.debug(
      `Creating transaction: ${JSON.stringify(transactionDto)}`,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== UserRole.ADMIN && transactionDto.senderId !== userId) {
      throw new UnauthorizedException(
        'Unauthorized to create this transaction',
      );
    }

    // Verify sender has enough tokens
    const senderToken = await this.prisma.token.findUnique({
      where: { userId: transactionDto.senderId },
    });

    if (!senderToken) {
      throw new NotFoundException(`Sender token not found`);
    }

    if (senderToken.tokenBalance < transactionDto.amount) {
      throw new BadRequestException('Insufficient token balance');
    }

    const recipientToken = await this.prisma.token.findUnique({
      where: { userId: transactionDto.recipientId },
    });

    if (!recipientToken) {
      throw new NotFoundException(`Recipient token not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.tokenTransaction.create({
        data: {
          senderId: transactionDto.senderId,
          recipientId: transactionDto.recipientId,
          tokenId: senderToken.id,
          amount: transactionDto.amount,
        },
      });

      await prisma.token.update({
        where: { userId: transactionDto.senderId },
        data: {
          tokenBalance: {
            decrement: transactionDto.amount,
          },
        },
      });

      await prisma.token.update({
        where: { userId: transactionDto.recipientId },
        data: {
          tokenBalance: {
            increment: transactionDto.amount,
          },
        },
      });

      return transaction;
    });
  }

  async getTransactionHistory(userId: string, query: TokenQueryDto) {
    // Fetch the user to ensure they exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Extract pagination parameters from the query
    const { skip = 0, take = 10 } = query;

    // Fetch the transaction history for the user
    return await this.prisma.tokenTransaction.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }], // Include transactions where the user is the sender or recipient
      },
      orderBy: {
        timestamp: 'desc', // Sort by timestamp in descending order (most recent first)
      },
      skip: Number(skip), // Convert skip to a number
      take: Number(take), // Convert take to a number
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
  async getSentTransactions(userId: string, query: TokenQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { skip = 0, take = 10 } = query;

    return this.prisma.tokenTransaction.findMany({
      where: {
        senderId: userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: Number(skip), // Convert skip to a number
      take: Number(take), // Convert take to a number
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getReceivedTransactions(userId: string, query: TokenQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { skip = 0, take = 10 } = query;

    return this.prisma.tokenTransaction.findMany({
      where: {
        recipientId: userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: Number(skip), // Convert skip to a number
      take: Number(take), // Convert take to a number
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getUserTokenRelations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.userTokenRelation.findMany({
      where: {
        userId,
      },
      include: {
        token: true,
      },
    });
  }

  // async addUserTokenRelation(userId: string, tokenId: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });
  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${userId} not found`);
  //   }
  //   return this.prisma.userTokenRelation.create({
  //     data: {
  //       userId,
  //       tokenId,
  //     },
  //   });
  // }

  // async removeUserTokenRelation(userId: string, tokenId: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //   });
  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${userId} not found`);
  //   }

  //   const relation = await this.prisma.userTokenRelation.findFirst({
  //     where: {
  //       userId,
  //       tokenId,
  //     },
  //   });

  //   if (!relation) {
  //     throw new NotFoundException('Token relation not found');
  //   }

  //   return this.prisma.userTokenRelation.delete({
  //     where: {
  //       id: relation.id,
  //     },
  //   });
  // }
}
