import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationsController } from './collaborations.controller';

describe('CollaborationsController', () => {
  let controller: CollaborationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollaborationsController],
    }).compile();

    controller = module.get<CollaborationsController>(CollaborationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
