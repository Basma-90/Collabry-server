// src/modules/tokens/tokens.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTokenDto } from './dtos/create-token.dto';
import { UpdateTokenDto } from './dtos/update-token.dto';
import { TokenQueryDto } from './dtos/token-query.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { TokenTransactionDto } from './dtos/token-transaction.dto';
import { TokenTransactionResponseDto } from './dtos/token-transaction-response.dto';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';
import { authGuard } from '../../guards/auth.guard';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private readonly tokensService: TokensService) {}

  /**-----------------------------------------------
   * @desc    Create a new token for a user
   * @route   /tokens/create
   * @method  Post
   * @access  for authenticated user ( admin can create for other users)
   ------------------------------------------------*/
  @Post('/create')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new token for a user' })
  @ApiBody({ type: CreateTokenDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The token has been successfully created.',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  async createToken(@Body() createTokenDto: CreateTokenDto, @Req() req) {
    return this.tokensService.createToken(req.user.id, createTokenDto);
  }

  /**-----------------------------------------------
   * @desc    Get token by user ID
   * @route   /tokens/user/:userId
   * @method  Get
   * @access  for authenticated user (admin or self)
   ------------------------------------------------*/
  @Get('user/:userId')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get token by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token information',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Token not found',
  })
  async getTokenByUserId(
    @Param('userId', MongoIdValidationPipe) userId: string,
    @Req() req,
  ) {
    return this.tokensService.findTokenByUserId(req.user.id, userId);
  }

  /**-----------------------------------------------
   * @desc    Get my token
   * @route   /tokens/my-token
   * @method  Get
   * @access  for authenticated user
   ------------------------------------------------*/
  @Get('my-token')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token information',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Token not found',
  })
  async getMyToken(@Req() req) {
    return this.tokensService.findTokenByUserId(req.user.id, req.user.id);
  }

  /**-----------------------------------------------
   * @desc    Update token
   * @route   /tokens/:userId
   * @method  Patch
   * @access  for authenticated admin user
   ------------------------------------------------*/
  @Patch(':userId')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: UpdateTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The token has been successfully updated.',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Token not found.',
  })
  async updateToken(
    @Param('userId', MongoIdValidationPipe) userId: string,
    @Body() updateTokenDto: UpdateTokenDto,
    @Req() req,
  ) {
    return this.tokensService.updateToken(req.user.id, userId, updateTokenDto);
  }

  /**-----------------------------------------------
   * @desc    Create a token transaction
   * @route   /tokens/transaction
   * @method  Post
   * @access  for authenticated user
   ------------------------------------------------*/
  @Post('transaction')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a token transaction' })
  @ApiBody({ type: TokenTransactionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The transaction has been successfully created.',
    type: TokenTransactionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or insufficient balance.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  async createTransaction(
    @Body() transactionDto: TokenTransactionDto,
    @Req() req,
  ) {
    return this.tokensService.createTransaction(req.user.id, transactionDto);
  }

  /**-----------------------------------------------
   * @desc    Get transaction history
   * @route   /tokens/transactions
   * @method  Get
   * @access  for authenticated user
   ------------------------------------------------*/
  @Get('transactions')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ type: TokenQueryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction history',
    type: [TokenTransactionResponseDto],
  })
  async getTransactionHistory(@Query() query: TokenQueryDto, @Req() req) {
    return {
      data: await this.tokensService.getTransactionHistory(req.user.id, query),
      meta: {
        skip: query.skip || 0,
        take: query.take || 10,
      },
    };
  }

  /**-----------------------------------------------
   * @desc    Get sent transactions
   * @route   /tokens/transactions/sent
   * @method  Get
   * @access  for authenticated user
   ------------------------------------------------*/
  @Get('transactions/sent')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sent transactions' })
  @ApiQuery({ type: TokenQueryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sent transactions',
    type: [TokenTransactionResponseDto],
  })
  async getSentTransactions(@Query() query: TokenQueryDto, @Req() req) {
    return {
      data: await this.tokensService.getSentTransactions(req.user.id, query),
      meta: {
        skip: query.skip || 0,
        take: query.take || 10,
      },
    };
  }

  /**-----------------------------------------------
   * @desc    Get received transactions
   * @route   /tokens/transactions/received
   * @method  Get
   * @access  for authenticated user
   ------------------------------------------------*/
  @Get('transactions/received')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get received transactions' })
  @ApiQuery({ type: TokenQueryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Received transactions',
    type: [TokenTransactionResponseDto],
  })
  async getReceivedTransactions(@Query() query: TokenQueryDto, @Req() req) {
    return {
      data: await this.tokensService.getReceivedTransactions(
        req.user.id,
        query,
      ),
      meta: {
        skip: query.skip || 0,
        take: query.take || 10,
      },
    };
  }

  /**-----------------------------------------------
   * @desc    Get user token relations
   * @route   /tokens/relations
   * @method  Get
   * @access  for authenticated user
   ------------------------------------------------*/
  @Get('relations')
  @UseGuards(authGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user token relations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User token relations',
  })
  async getUserTokenRelations(@Req() req) {
    return this.tokensService.getUserTokenRelations(req.user.id);
  }

  // /**-----------------------------------------------
  //  * @desc    Add user token relation
  //  * @route   /tokens/relations/:tokenId
  //  * @method  Post
  //  * @access  for authenticated user
  //  ------------------------------------------------*/
  // @Post('relations/:tokenId')
  // @UseGuards(authGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Add user token relation' })
  // @ApiParam({ name: 'tokenId', description: 'Token ID' })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'The relation has been successfully created.',
  // })
  // async addUserTokenRelation(
  //   @Param('tokenId', MongoIdValidationPipe) tokenId: string,
  //   @Req() req,
  // ) {
  //   return this.tokensService.addUserTokenRelation(req.user.id, tokenId);
  // }

  // /**-----------------------------------------------
  //  * @desc    Remove user token relation
  //  * @route   /tokens/relations/:tokenId
  //  * @method  Delete
  //  * @access  for authenticated user
  //  ------------------------------------------------*/
  // @Post('relations/:tokenId/remove')
  // @UseGuards(authGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Remove user token relation' })
  // @ApiParam({ name: 'tokenId', description: 'Token ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'The relation has been successfully removed.',
  // })
  // async removeUserTokenRelation(
  //   @Param('tokenId', MongoIdValidationPipe) tokenId: string,
  //   @Req() req,
  // ) {
  //   return this.tokensService.removeUserTokenRelation(req.user.id, tokenId);
  // }
}
