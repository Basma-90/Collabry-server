import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationsService } from './collaborations.service';

describe('CollaborationsService', () => {
  let service: CollaborationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollaborationsService],
    }).compile();

    service = module.get<CollaborationsService>(CollaborationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
