import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationService } from './collaborations.service';

describe('CollaborationsService', () => {
  let service: CollaborationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollaborationService],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
